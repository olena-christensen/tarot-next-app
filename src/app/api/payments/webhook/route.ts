import { NextResponse } from "next/server";
import { alertOps } from "@/lib/alert";
import { verifyMonoWebhook } from "@/lib/mono";
import { applyMonoInvoiceStatus } from "@/lib/paymentActivation";

// Plata by mono webhook. Mono warns deliveries can be duplicated and arrive out
// of order, so the applied logic is IDEMPOTENT and order-independent (see
// applyMonoInvoiceStatus). This handler's only jobs are to VERIFY the signature
// and hand the payload to that shared applier — the same one the reconciliation
// cron uses for statuses whose webhook never arrived.

type MonoWebhookPayload = {
  invoiceId?: string;
  status?: string;
  amount?: number;
  ccy?: number;
  walletData?: { cardToken?: string };
  paymentInfo?: { maskedPan?: string; paymentSystem?: string };
  failureReason?: string;
};

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
    // Either someone is probing the endpoint or mono rotated its key and our
    // cache is stale — both are worth knowing about, and the hourly throttle
    // stops a probe from flooding the inbox.
    await alertOps(
      "webhook:signature",
      "[theveil] payment webhook: invalid signature",
      [
        "A request to /api/payments/webhook failed signature verification.",
        "If this repeats, check mono's public key and the cached copy.",
      ]
    );
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

  if (!invoiceId || !status) {
    // Verified but unusable — ack so mono stops retrying; nothing to apply.
    console.warn("[webhook] verified payload missing invoiceId/status");
    return NextResponse.json({ ok: true });
  }

  try {
    await applyMonoInvoiceStatus(
      {
        invoiceId,
        status,
        cardToken: payload.walletData?.cardToken,
        maskedPan: payload.paymentInfo?.maskedPan,
        paymentSystem: payload.paymentInfo?.paymentSystem,
        failureReason: payload.failureReason,
      },
      new Date()
    );
  } catch (err) {
    console.error("[webhook] applyMonoInvoiceStatus failed", { invoiceId, err });
    await alertOps(
      "webhook:apply",
      "[theveil] payment webhook: failed to apply a verified payment",
      [
        `Invoice ${invoiceId} (status ${status}) could not be applied.`,
        "The customer may have paid without receiving their tier or credit.",
        "The reconcile sweep should recover it within the hour; if it does not,",
        "check the Payment ledger row for this invoice.",
      ]
    );
    // Rethrow on purpose: a 500 makes mono retry, which is the right response to
    // a transient failure. Acking here would drop the payment on the floor.
    throw err;
  }

  // Always ack (200) after a verified payload so mono stops retrying.
  return NextResponse.json({ ok: true });
}
