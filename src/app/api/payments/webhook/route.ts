import { NextResponse } from "next/server";
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

  // Always ack (200) after a verified payload so mono stops retrying.
  return NextResponse.json({ ok: true });
}
