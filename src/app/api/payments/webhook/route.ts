import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMonoWebhook } from "@/lib/mono";
import { PLAN_PRICES } from "@/lib/mono";
import { sendRenewalReceiptEmail, sendPaymentFailedEmail } from "@/lib/mailer";
import type { Prisma } from "@/generated/prisma";

// Plata by mono webhook. Mono warns that deliveries can be duplicated and
// arrive out of order, so this handler is IDEMPOTENT: correctness comes from
// the activatedInvoiceId guard + a no-downgrade rule, not from delivery order.
// We never trust the payload's order; we only ever move state forward.

type MonoWebhookPayload = {
  invoiceId?: string;
  status?: string;
  amount?: number;
  ccy?: number;
  walletData?: { cardToken?: string };
  paymentInfo?: { maskedPan?: string; paymentSystem?: string };
  failureReason?: string;
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export async function POST(req: Request) {
  // RAW body first — the signature is computed over the raw bytes.
  const rawBody = await req.text();

  const xSign = req.headers.get("X-Sign");
  if (!xSign) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Security-critical: reject anything that doesn't verify against mono's key.
  const valid = await verifyMonoWebhook(rawBody, xSign);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: MonoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const invoiceId = payload.invoiceId;
  const status = payload.status;
  const cardToken = payload.walletData?.cardToken;
  const maskedPan = payload.paymentInfo?.maskedPan;
  const paymentSystem = payload.paymentInfo?.paymentSystem;
  const failureReason = payload.failureReason;

  if (!invoiceId || !status) {
    // Verified but unusable — ack so mono stops retrying; nothing to apply.
    console.warn("[webhook] verified payload missing invoiceId/status");
    return NextResponse.json({ ok: true });
  }

  // Append-style payment ledger update. Additive bookkeeping that runs IN
  // ADDITION TO the Subscription state machine below — never replaces it, and
  // is wrapped so a ledger failure can never throw before the 200 ack.
  // noDowngrade mirrors the Subscription rule: an intermediate status must not
  // overwrite a Payment row already marked "success".
  const updatePaymentLedger = async (
    nextStatus: string,
    noDowngrade: boolean
  ): Promise<void> => {
    const data: Prisma.PaymentUpdateManyMutationInput = { status: nextStatus };
    if (maskedPan) data.maskedPan = maskedPan;
    if (paymentSystem) data.paymentSystem = paymentSystem;
    if (failureReason) data.failureReason = failureReason;
    if (cardToken) data.cardToken = cardToken;

    const where: Prisma.PaymentWhereInput = { monoInvoiceId: invoiceId };
    if (noDowngrade) {
      where.status = { not: "success" };
    }

    try {
      // updateMany → a missing ledger row is a safe no-op (count 0).
      await prisma.payment.updateMany({ where, data });
    } catch (err) {
      console.error(
        `[webhook] failed to update payment ledger for invoiceId ${invoiceId}`,
        err
      );
    }
  };

  const sub = await prisma.subscription.findFirst({
    where: { monoInvoiceId: invoiceId },
  });

  if (!sub) {
    // Unknown invoice — ack (200) so mono stops retrying. Nothing to do.
    console.warn(`[webhook] no subscription for invoiceId ${invoiceId}`);
    return NextResponse.json({ ok: true });
  }

  const pendingPlanId = sub.pendingPlanId;

  // Renewal = the activating tier already equals the current tier (a token
  // charge re-buying the same plan), vs a first-time purchase from FREE.
  // Captured BEFORE we clear pendingPlanId on the failure branch.
  const isRenewal =
    (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY") &&
    pendingPlanId === sub.planId;

  if (status === "success") {
    const now = new Date();
    // Hoisted so the renewal-receipt email below reuses the SAME expiry computed
    // for activation, instead of recomputing it (which could drift).
    let renewalExpiresAt: Date | null = null;
    const data: Prisma.SubscriptionUpdateManyMutationInput = {
      paymentStatus: "success",
      lastChargedAt: now,
      activatedInvoiceId: invoiceId,
      pendingPlanId: null,
    };

    if (pendingPlanId === "SINGLE") {
      // Consumable credit — never changes the recurring tier (planId).
      data.readingCredits = { increment: 1 };
    } else if (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY") {
      // Renewals extend from the PRIOR expiresAt (preserving the billing anchor
      // and any grace days); first-time purchases start a fresh period at `now`.
      const base = isRenewal && sub.expiresAt ? sub.expiresAt : now;
      const expiresAt =
        pendingPlanId === "MONTHLY" ? addMonths(base, 1) : addYears(base, 1);
      data.planId = pendingPlanId;
      data.expiresAt = expiresAt;
      data.nextChargeAt = expiresAt;
      renewalExpiresAt = expiresAt;
      if (isRenewal) {
        // Successful renewal clears the dunning counter; keep original startedAt.
        data.renewalAttempts = 0;
      } else {
        data.startedAt = now;
      }
    } else {
      // success with no/unknown pending plan — record payment but don't grant
      // anything we can't attribute.
      console.warn(
        `[webhook] success for invoiceId ${invoiceId} with pendingPlanId=${pendingPlanId}`
      );
    }

    // ATOMIC COMPARE-AND-SET: only the delivery that flips activatedInvoiceId
    // from null to this invoiceId wins. Two simultaneous "success" deliveries
    // race on this single conditional write — the loser matches 0 rows and
    // becomes a no-op, so the credit increment / tier upgrade run exactly once.
    // monoInvoiceId scopes the write to the row for *this* invoice and ignores
    // stale deliveries for a superseded prior invoice on the same subscription.
    // (create-invoice resets activatedInvoiceId = null when a new invoice is
    // issued, so this guard is correct across re-buys.)
    const { count } = await prisma.subscription.updateMany({
      where: { monoInvoiceId: invoiceId, activatedInvoiceId: null },
      data,
    });

    if (count === 0) {
      // Another delivery already activated this invoice, or it's a duplicate.
      console.info(
        `[webhook] success for invoiceId ${invoiceId} already applied — no-op`
      );
    }

    // Persist the recurring-charge token UNCONDITIONALLY — decoupled from the
    // one-time activation guard above. Mono may deliver walletData.cardToken in
    // a LATER "success" callback than the one that first activated the tier, so
    // folding it into the activatedInvoiceId-gated write would drop it (that
    // later delivery matches 0 rows there). The renewal cron charges this field,
    // so it must land regardless of which delivery carries it. Idempotent:
    // re-writing the same token is harmless. Mirrors the unconditional ledger
    // write below. (Without this, tokenization can be live yet monoCardToken
    // stays null while Payment.cardToken is set — the exact bug seen 2026-06-30.)
    if (cardToken) {
      await prisma.subscription.updateMany({
        where: { monoInvoiceId: invoiceId },
        data: { monoCardToken: cardToken },
      });
    }

    // Ledger: record success unconditionally (success is never a downgrade).
    await updatePaymentLedger("success", false);

    // Renewal receipt (best-effort; never blocks the ack). Only in the renewal
    // context — first-time buyers saw the result live on Mono's page. Guarded by
    // count > 0 so a duplicate delivery (already-applied) doesn't re-email.
    if (isRenewal && count > 0 && renewalExpiresAt && (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY")) {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendRenewalReceiptEmail({
          to: user.email,
          planId: pendingPlanId,
          amountMinor: payload.amount ?? PLAN_PRICES[pendingPlanId],
          // Reuse the activation expiry computed above (no recomputation/drift).
          expiresAt: renewalExpiresAt,
        });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (status === "failure" || status === "reversed") {
    // Record the terminal failure. Never touch planId, readingCredits, or
    // activatedInvoiceId — those reflect successfully applied payments only.
    // Clear pendingPlanId; a retry will create a fresh invoice.
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { paymentStatus: status, pendingPlanId: null },
    });
    // Ledger: terminal status, mirrors Subscription (applied unconditionally).
    await updatePaymentLedger(status, false);

    // Dunning email (best-effort) only for renewal failures — first-time
    // purchase failures were shown live on Mono's page.
    if (isRenewal && (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY")) {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendPaymentFailedEmail({ to: user.email, planId: pendingPlanId });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (status === "processing" || status === "created") {
    // NO-DOWNGRADE: a late/out-of-order intermediate status must never clobber
    // a completed payment. Only record it if we haven't already succeeded.
    if (sub.paymentStatus !== "success") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { paymentStatus: status },
      });
    }
    // Ledger: intermediate status — apply the no-downgrade guard.
    await updatePaymentLedger(status, true);
    return NextResponse.json({ ok: true });
  }

  // Unknown status — same no-downgrade rule: record only if not already success.
  console.warn(`[webhook] unknown status "${status}" for invoiceId ${invoiceId}`);
  if (sub.paymentStatus !== "success") {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { paymentStatus: status },
    });
  }
  // Ledger: unknown status treated as intermediate — apply no-downgrade guard.
  await updatePaymentLedger(status, true);
  return NextResponse.json({ ok: true });
}
