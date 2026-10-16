import { prisma } from "@/lib/prisma";
import { PLAN_PRICES, PLAN_PRICES_EUR } from "@/lib/mono";
import { MOONSTONE_PACKS, isMoonstonePack } from "@/lib/moonstones";
import { sendRenewalReceiptEmail, sendPaymentFailedEmail } from "@/lib/mailer";
import type { Prisma, Subscription } from "@/generated/prisma";

// Applies a mono invoice's status to our state. BOTH the webhook (push) and the
// reconciliation cron (poll, for deliveries that never arrived) go through here,
// so activation logic lives in one place.
//
// What to grant comes from the `Payment` row of THAT invoice (productType,
// userId) — never from the subscription's single "current invoice" slot
// (`monoInvoiceId` / `pendingPlanId`). The slot is overwritten by every new
// checkout and every renewal charge, so reading it lost purchases: open two
// checkouts, pay the first, and the card was charged with nothing granted
// (code review 2026-10-15, item 1).
//
// "Already applied" is decided per invoice, on the Payment row itself: the
// success grant runs only for the write that moves that row to "success", inside
// one transaction with the grant. A repeated or concurrent delivery finds the row
// already "success" (or "reversed") and grants nothing.
//
// The slot fields on Subscription (paymentStatus, pendingPlanId) still matter:
// the payment result page and the renewal state machine read them. Only the
// invoice that currently holds the slot moves them.

export type MonoInvoiceFields = {
  invoiceId: string;
  status: string;
  cardToken?: string;
  maskedPan?: string;
  paymentSystem?: string;
  failureReason?: string;
};

export type ApplyResult = "success" | "failure" | "expired" | "intermediate";

const RECURRING = ["MONTHLY", "YEARLY"] as const;
type Recurring = (typeof RECURRING)[number];

function isRecurring(value: string | null | undefined): value is Recurring {
  return value === "MONTHLY" || value === "YEARLY";
}

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

/** Renewal = re-buying the tier the account is already on (a token charge). */
function isRenewalOf(productType: string, sub: Subscription | null): boolean {
  return isRecurring(productType) && productType === sub?.planId;
}

/** The subscription changes a paid invoice of `productType` grants. */
function grantFor(
  productType: string,
  sub: Subscription,
  now: Date
): { data: Prisma.SubscriptionUpdateInput; expiresAt: Date | null } {
  if (isMoonstonePack(productType)) {
    // Moonstone pack — adds to the balance, never changes the tier (planId).
    return {
      data: { readingCredits: { increment: MOONSTONE_PACKS[productType].qty } },
      expiresAt: null,
    };
  }
  if (productType === "SINGLE") {
    // Legacy €1 "Offering" (no longer sold) — still honoured for invoices
    // created before moonstones replaced it. One credit = one moonstone.
    return { data: { readingCredits: { increment: 1 } }, expiresAt: null };
  }
  if (isRecurring(productType)) {
    // Renewals extend from the PRIOR expiresAt (preserving the billing anchor
    // and any grace days); first-time purchases start a fresh period at `now`.
    const renewal = isRenewalOf(productType, sub);
    const base = renewal && sub.expiresAt ? sub.expiresAt : now;
    const expiresAt = productType === "MONTHLY" ? addMonths(base, 1) : addYears(base, 1);
    return {
      data: {
        planId: productType,
        expiresAt,
        nextChargeAt: expiresAt,
        // Successful renewal clears the dunning counter; keep original startedAt.
        ...(renewal ? { renewalAttempts: 0 } : { startedAt: now }),
      },
      expiresAt,
    };
  }
  // Charged for something we can't attribute — record it, grant nothing.
  console.warn(`[payment-apply] success for unknown productType "${productType}"`);
  return { data: {}, expiresAt: null };
}

export async function applyMonoInvoiceStatus(
  fields: MonoInvoiceFields,
  now: Date
): Promise<ApplyResult> {
  const { invoiceId, status, cardToken, maskedPan, paymentSystem, failureReason } = fields;

  const payment = await prisma.payment.findUnique({ where: { monoInvoiceId: invoiceId } });
  if (!payment) {
    // Every invoice we create gets its ledger row before the user can pay, and a
    // renewal charge writes its row right after mono accepts it. A delivery that
    // beats that write lands here: throwing makes the webhook answer 500, so
    // mono retries once the row exists (and the webhook alerts).
    throw new Error(`[payment-apply] no Payment row for invoiceId ${invoiceId}`);
  }
  const { userId, productType } = payment;

  if (userId === null) {
    // The account was deleted after paying; its payment record was kept. Nothing
    // to grant or email — record what mono says and acknowledge it, so mono
    // stops retrying.
    await prisma.payment.updateMany({
      where: { monoInvoiceId: invoiceId },
      data: {
        status,
        ...(maskedPan ? { maskedPan } : {}),
        ...(paymentSystem ? { paymentSystem } : {}),
        ...(failureReason ? { failureReason } : {}),
      },
    });
    console.info(`[payment-apply] ${status} for invoiceId ${invoiceId} of a deleted account — recorded only`);
    return status === "success"
      ? "success"
      : status === "expired"
        ? "expired"
        : status === "failure" || status === "reversed"
          ? "failure"
          : "intermediate";
  }

  const details: Prisma.PaymentUpdateManyMutationInput = {};
  if (maskedPan) details.maskedPan = maskedPan;
  if (paymentSystem) details.paymentSystem = paymentSystem;
  if (failureReason) details.failureReason = failureReason;
  if (cardToken) details.cardToken = cardToken;

  if (status === "success") {
    const granted = await prisma.$transaction(async (tx) => {
      // Serialize this user's grants, so two different invoices settling at once
      // can't both extend the tier from the same old expiry. Same lock key as
      // reading consumption (/api/readings/consume).
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

      // THE "already applied" guard, per invoice: only the write that moves this
      // row to "success" grants. "reversed" is excluded so a late repeat of the
      // success after a refund neither re-grants nor rewrites the ledger.
      const { count } = await tx.payment.updateMany({
        where: { monoInvoiceId: invoiceId, status: { notIn: ["success", "reversed"] } },
        data: { status: "success", ...details },
      });
      if (count === 0) return null;

      const sub = await tx.subscription.findUnique({ where: { userId } });
      if (!sub) {
        throw new Error(`[payment-apply] no Subscription for user ${userId} (invoice ${invoiceId})`);
      }

      // Invoices settled before this change were marked applied on the
      // subscription instead; a ledger row that never left "created" must not
      // grant them a second time.
      if (sub.activatedInvoiceId === invoiceId) return null;

      const renewal = isRenewalOf(productType, sub);
      const grant = grantFor(productType, sub, now);
      const holdsSlot = sub.monoInvoiceId === invoiceId;

      await tx.subscription.update({
        where: { userId },
        data: {
          ...grant.data,
          lastChargedAt: now,
          ...(holdsSlot
            ? { paymentStatus: "success", pendingPlanId: null, activatedInvoiceId: invoiceId }
            : {}),
        },
      });
      return { renewal, expiresAt: grant.expiresAt };
    });

    if (!granted) {
      console.info(`[payment-apply] success for invoiceId ${invoiceId} already applied — no-op`);
      // Mono may send card details (the token) in a LATER success callback than
      // the one that granted; keep them on the ledger row.
      if (Object.keys(details).length > 0) {
        await prisma.payment.updateMany({
          where: { monoInvoiceId: invoiceId, status: "success" },
          data: details,
        });
      }
    }

    // Persist the recurring-charge token outside the one-time grant for the
    // same reason. The renewal cron charges this field. Idempotent.
    if (cardToken && isRecurring(productType)) {
      await prisma.subscription.updateMany({
        where: { userId },
        data: { monoCardToken: cardToken },
      });
    }

    // Renewal receipt (best-effort), once — first-time buyers saw the result
    // live on mono's page.
    if (granted?.renewal && granted.expiresAt && isRecurring(productType)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, preferredLocale: true },
      });
      if (user?.email) {
        await sendRenewalReceiptEmail({
          to: user.email,
          locale: user.preferredLocale,
          planId: productType,
          // Both figures, from our own price table — never the mono-echoed
          // amount, which reflects whatever mono settled and can differ.
          // amountMinor is hryvnia (what the card was charged), amountEur is
          // the advertised price. The receipt prints both; see formatCharged.
          amountMinor: PLAN_PRICES[productType],
          amountEur: PLAN_PRICES_EUR[productType],
          expiresAt: granted.expiresAt,
        });
      }
    }
    return "success";
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const holdsSlot = sub?.monoInvoiceId === invoiceId;

  if (status === "failure" || status === "reversed" || status === "expired") {
    // Terminal. Never touches planId or readingCredits — those reflect granted
    // payments only. Clearing pendingPlanId lets a retry start a fresh invoice.
    await prisma.payment.updateMany({
      where: { monoInvoiceId: invoiceId },
      data: { status, ...details },
    });
    if (holdsSlot) {
      await prisma.subscription.updateMany({
        where: { userId, monoInvoiceId: invoiceId },
        data: { paymentStatus: status, pendingPlanId: null },
      });
    }

    if (status === "expired") {
      // Abandoned checkout: deliberately NO email — nothing failed, they simply
      // walked away, and "we couldn't charge your card" would be a lie.
      return "expired";
    }

    // Dunning email (best-effort) only for a failed renewal — first-time
    // purchase failures were shown live on mono's page.
    if (holdsSlot && isRecurring(productType) && isRenewalOf(productType, sub)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, preferredLocale: true },
      });
      if (user?.email) {
        await sendPaymentFailedEmail({
          to: user.email,
          locale: user.preferredLocale,
          planId: productType,
        });
      }
    }
    return "failure";
  }

  // created / processing / anything unknown. NO-DOWNGRADE, in the WHERE clause so
  // it is evaluated at write time: a late or out-of-order intermediate status must
  // never overwrite a settled one.
  if (status !== "processing" && status !== "created") {
    console.warn(`[payment-apply] unknown status "${status}" for invoiceId ${invoiceId}`);
  }
  const SETTLED = ["success", "failure", "reversed", "expired"];
  await prisma.payment.updateMany({
    where: { monoInvoiceId: invoiceId, status: { notIn: SETTLED } },
    data: { status, ...details },
  });
  if (holdsSlot) {
    await prisma.subscription.updateMany({
      where: { userId, monoInvoiceId: invoiceId, paymentStatus: { notIn: SETTLED } },
      data: { paymentStatus: status },
    });
  }
  return "intermediate";
}
