import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMonoWebhook } from "@/lib/mono";
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

  if (status === "success") {
    const now = new Date();
    const data: Prisma.SubscriptionUpdateManyMutationInput = {
      paymentStatus: "success",
      lastChargedAt: now,
      activatedInvoiceId: invoiceId,
      pendingPlanId: null,
    };

    if (pendingPlanId === "SINGLE") {
      // Consumable credit — never changes the recurring tier (planId).
      data.readingCredits = { increment: 1 };
    } else if (pendingPlanId === "MONTHLY") {
      const expiresAt = addMonths(now, 1);
      data.planId = "MONTHLY";
      data.startedAt = now;
      data.expiresAt = expiresAt;
      data.nextChargeAt = expiresAt;
    } else if (pendingPlanId === "YEARLY") {
      const expiresAt = addYears(now, 1);
      data.planId = "YEARLY";
      data.startedAt = now;
      data.expiresAt = expiresAt;
      data.nextChargeAt = expiresAt;
    } else {
      // success with no/unknown pending plan — record payment but don't grant
      // anything we can't attribute.
      console.warn(
        `[webhook] success for invoiceId ${invoiceId} with pendingPlanId=${pendingPlanId}`
      );
    }

    // Store the card token for future recurring charges when mono sends one.
    if (cardToken) {
      data.monoCardToken = cardToken;
    }

    // ATOMIC COMPARE-AND-SET: only the delivery that flips activatedInvoiceId
    // from null to this invoiceId wins. Two simultaneous "success" deliveries
    // race on this single conditional write — the loser matches 0 rows and
    // becomes a no-op, so the credit increment / tier upgrade / cardToken save
    // run exactly once. monoInvoiceId scopes the write to the row for *this*
    // invoice and ignores stale deliveries for a superseded prior invoice on
    // the same subscription. (create-invoice resets activatedInvoiceId = null
    // when a new invoice is issued, so this guard is correct across re-buys.)
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
    // Ledger: record success unconditionally (success is never a downgrade).
    await updatePaymentLedger("success", false);
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
