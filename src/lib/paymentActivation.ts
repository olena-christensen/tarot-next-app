import { prisma } from "@/lib/prisma";
import { PLAN_PRICES, PLAN_PRICES_EUR } from "@/lib/mono";
import { sendRenewalReceiptEmail, sendPaymentFailedEmail } from "@/lib/mailer";
import type { Prisma } from "@/generated/prisma";

// Applies a mono invoice's status to our state. Extracted verbatim from the
// webhook so BOTH the webhook (push) and the reconciliation cron (poll, for
// deliveries that never arrived) apply outcomes through the exact same path —
// activation logic lives here once.
//
// Idempotent and order-independent by design (see the activatedInvoiceId
// compare-and-set + no-downgrade guards below): safe to call from a duplicate
// webhook and the cron concurrently. Callers pass an already-trusted invoiceId +
// status (the webhook verifies the signature; the cron reads status from mono).

export type MonoInvoiceFields = {
  invoiceId: string;
  status: string;
  cardToken?: string;
  maskedPan?: string;
  paymentSystem?: string;
  failureReason?: string;
};

export type ApplyResult =
  | "no_subscription"
  | "success"
  | "failure"
  | "expired"
  | "intermediate";

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

export async function applyMonoInvoiceStatus(
  fields: MonoInvoiceFields,
  now: Date
): Promise<ApplyResult> {
  const { invoiceId, status, cardToken, maskedPan, paymentSystem, failureReason } =
    fields;

  // Append-style payment ledger update. Additive bookkeeping that runs IN
  // ADDITION TO the Subscription state machine below — never replaces it, and is
  // wrapped so a ledger failure can never throw. noDowngrade mirrors the
  // Subscription rule: an intermediate status must not overwrite a Payment row
  // already marked "success".
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
        `[payment-apply] failed to update payment ledger for invoiceId ${invoiceId}`,
        err
      );
    }
  };

  const sub = await prisma.subscription.findFirst({
    where: { monoInvoiceId: invoiceId },
  });

  if (!sub) {
    // Unknown/superseded invoice — nothing to apply.
    console.warn(`[payment-apply] no subscription for invoiceId ${invoiceId}`);
    return "no_subscription";
  }

  const pendingPlanId = sub.pendingPlanId;

  // Renewal = the activating tier already equals the current tier (a token charge
  // re-buying the same plan), vs a first-time purchase from FREE. Captured BEFORE
  // we clear pendingPlanId on the failure branch.
  const isRenewal =
    (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY") &&
    pendingPlanId === sub.planId;

  if (status === "success") {
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
        `[payment-apply] success for invoiceId ${invoiceId} with pendingPlanId=${pendingPlanId}`
      );
    }

    // ATOMIC COMPARE-AND-SET: only the write that flips activatedInvoiceId from
    // null to this invoiceId wins. Concurrent deliveries (duplicate webhook, or
    // the cron racing a webhook) race on this single conditional write — the
    // loser matches 0 rows and becomes a no-op, so the credit increment / tier
    // upgrade run exactly once. monoInvoiceId scopes the write to the row for
    // *this* invoice and ignores stale deliveries for a superseded prior invoice.
    const { count } = await prisma.subscription.updateMany({
      where: { monoInvoiceId: invoiceId, activatedInvoiceId: null },
      data,
    });

    if (count === 0) {
      console.info(
        `[payment-apply] success for invoiceId ${invoiceId} already applied — no-op`
      );
    }

    // Persist the recurring-charge token UNCONDITIONALLY — decoupled from the
    // one-time activation guard above. Mono may deliver walletData.cardToken in a
    // LATER "success" callback than the one that first activated the tier, so
    // folding it into the activatedInvoiceId-gated write would drop it. The
    // renewal cron charges this field, so it must land regardless. Idempotent.
    if (cardToken) {
      await prisma.subscription.updateMany({
        where: { monoInvoiceId: invoiceId },
        data: { monoCardToken: cardToken },
      });
    }

    // Ledger: record success unconditionally (success is never a downgrade).
    await updatePaymentLedger("success", false);

    // Renewal receipt (best-effort). Only in the renewal context — first-time
    // buyers saw the result live on Mono's page. Guarded by count > 0 so a
    // duplicate/already-applied delivery doesn't re-email.
    if (
      isRenewal &&
      count > 0 &&
      renewalExpiresAt &&
      (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY")
    ) {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true, preferredLocale: true },
      });
      if (user?.email) {
        await sendRenewalReceiptEmail({
          to: user.email,
          locale: user.preferredLocale,
          planId: pendingPlanId,
          // Both figures, from our own price table — never the mono-echoed
          // amount, which reflects whatever mono settled and can differ.
          // amountMinor is hryvnia (what the card was charged), amountEur is
          // the advertised price. The receipt prints both; see formatCharged.
          amountMinor: PLAN_PRICES[pendingPlanId],
          amountEur: PLAN_PRICES_EUR[pendingPlanId],
          expiresAt: renewalExpiresAt,
        });
      }
    }
    return "success";
  }

  if (status === "failure" || status === "reversed") {
    // Record the terminal failure. Never touch planId, readingCredits, or
    // activatedInvoiceId — those reflect successfully applied payments only.
    // Clear pendingPlanId; a retry will create a fresh invoice.
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { paymentStatus: status, pendingPlanId: null },
    });
    await updatePaymentLedger(status, false);

    // Dunning email (best-effort) only for renewal failures — first-time
    // purchase failures were shown live on Mono's page.
    if (isRenewal && (pendingPlanId === "MONTHLY" || pendingPlanId === "YEARLY")) {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true, preferredLocale: true },
      });
      if (user?.email) {
        await sendPaymentFailedEmail({
          to: user.email,
          locale: user.preferredLocale,
          planId: pendingPlanId,
        });
      }
    }
    return "failure";
  }

  if (status === "expired") {
    // Abandoned checkout: mono expires an invoice the user never completed.
    // Terminal, so the row must stop looking "in flight" — otherwise
    // pendingPlanId sticks forever and the reconcile sweep re-polls it every
    // day. Deliberately NO dunning email: nothing failed, they simply walked
    // away, and "we couldn't charge your card" would be a lie.
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { paymentStatus: status, pendingPlanId: null },
    });
    await updatePaymentLedger(status, false);
    return "expired";
  }

  if (status === "processing" || status === "created") {
    // NO-DOWNGRADE (atomic): a late/out-of-order intermediate status must never
    // clobber a terminal one. The guard lives in the WHERE clause so it is
    // evaluated at write time (a read-then-write against the `sub` snapshot would
    // race duplicated/out-of-order deliveries).
    await prisma.subscription.updateMany({
      where: {
        id: sub.id,
        paymentStatus: { notIn: ["success", "failure", "reversed"] },
      },
      data: { paymentStatus: status },
    });
    await updatePaymentLedger(status, true);
    return "intermediate";
  }

  // Unknown status — same atomic no-downgrade rule as the intermediate branch.
  console.warn(
    `[payment-apply] unknown status "${status}" for invoiceId ${invoiceId}`
  );
  await prisma.subscription.updateMany({
    where: {
      id: sub.id,
      paymentStatus: { notIn: ["success", "failure", "reversed"] },
    },
    data: { paymentStatus: status },
  });
  await updatePaymentLedger(status, true);
  return "intermediate";
}
