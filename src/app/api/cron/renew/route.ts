import { NextResponse } from "next/server";
import { alertOnJobFailures } from "@/lib/alert";
import { prisma } from "@/lib/prisma";
import { chargeByToken, PLAN_PRICES } from "@/lib/mono";
import { decideRenewalAction } from "@/lib/renewal";
import { sendSubscriptionEndedEmail } from "@/lib/mailer";

// Daily renewal cron. Vercel attaches `Authorization: Bearer ${CRON_SECRET}`
// automatically when CRON_SECRET is set, so we reject anything else — without
// this, anyone hitting the URL could trigger real charges. The cron NEVER
// activates anything itself: it initiates token charges (driving the existing
// signed webhook) and runs the dunning state machine. See spec §7/§8.

export const dynamic = "force-dynamic";

async function downgradeToFree(
  subId: string,
  userId: string,
  reason: "canceled" | "payment_failed" | "no_token"
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subId },
    data: { planId: "FREE", nextChargeAt: null, renewalAttempts: 0, paymentStatus: null, canceledAt: null },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (user?.email) {
    await sendSubscriptionEndedEmail({ to: user.email, reason });
  }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: { planId: { in: ["MONTHLY", "YEARLY"] } },
  });

  let charged = 0;
  let downgraded = 0;
  // Counted so the run can report a failure rather than only whispering it into
  // the logs. Every increment sits beside an existing console.error.
  let errors = 0;

  for (const sub of subs) {
    const action = decideRenewalAction(
      {
        autoRenew: sub.autoRenew,
        planId: sub.planId,
        expiresAt: sub.expiresAt,
        nextChargeAt: sub.nextChargeAt,
        monoCardToken: sub.monoCardToken,
        paymentStatus: sub.paymentStatus,
        renewalAttempts: sub.renewalAttempts,
        lastRenewalAttemptAt: sub.lastRenewalAttemptAt,
      },
      now
    );

    if (action.type === "none") continue;

    if (action.type === "downgrade") {
      try {
        await downgradeToFree(sub.id, sub.userId, action.reason);
        downgraded++;
      } catch (err) {
        console.error(`[cron/renew] downgrade failed for sub ${sub.id}`, err);
        errors++;
      }
      continue;
    }

    // action.type === "charge": a paid plan with a token. Narrow the type.
    const plan = sub.planId as "MONTHLY" | "YEARLY";
    const token = sub.monoCardToken;
    if (!token) continue; // defensive; decideRenewalAction already guarantees it

    // Reserve the attempt FIRST, using the same bookkeeping as create-invoice:
    // set pendingPlanId, reset activatedInvoiceId, mark paymentStatus "created"
    // (so a concurrent run sees an in-flight charge and skips), bump the counter.
    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          pendingPlanId: plan,
          activatedInvoiceId: null,
          paymentStatus: "created",
          renewalAttempts: { increment: 1 },
          lastRenewalAttemptAt: now,
        },
      });
    } catch (err) {
      console.error(`[cron/renew] failed to reserve attempt for sub ${sub.id}`, err);
      errors++;
      continue;
    }

    const reference = `${sub.userId}:${plan}:renewal:${now.getTime()}`;
    let invoiceId: string;
    try {
      const res = await chargeByToken({
        cardToken: token,
        amount: PLAN_PRICES[plan],
        reference,
        destination: `The Veil — ${plan} renewal`,
      });
      invoiceId = res.invoiceId;
    } catch (err) {
      // Charge initiation failed (network/API). Mark the attempt failed so the
      // state machine retries tomorrow; leave the bumped counter in place.
      console.error(`[cron/renew] chargeByToken failed for sub ${sub.id}`, err);
      errors++;
      await prisma.subscription
        .update({ where: { id: sub.id }, data: { paymentStatus: "failure" } })
        .catch((e) => console.error(`[cron/renew] failed to mark failure for sub ${sub.id}`, e));
      continue;
    }

    // Store the invoice id so the webhook can correlate the callback, and write
    // the ledger row (best-effort). The webhook is the source of truth for the
    // outcome (period extension, receipt/dunning email).
    await prisma.subscription
      .update({ where: { id: sub.id }, data: { monoInvoiceId: invoiceId } })
      .catch((e) => console.error(`[cron/renew] failed to store invoiceId for sub ${sub.id}`, e));

    await prisma.payment
      .create({
        data: {
          userId: sub.userId,
          monoInvoiceId: invoiceId,
          reference,
          productType: plan,
          amount: PLAN_PRICES[plan],
          currency: "EUR",
          status: "created",
        },
      })
      .catch((e) => console.error(`[cron/renew] failed to write ledger row for sub ${sub.id}`, e));

    charged++;
  }

  const result = { ok: true, scanned: subs.length, charged, downgraded, errors };
  console.log("[cron/renew] done", result);
  // The money path: a silent failure here is a customer who quietly loses access
  // or is quietly not charged.
  await alertOnJobFailures("renew", result);

  return NextResponse.json(result);
}
