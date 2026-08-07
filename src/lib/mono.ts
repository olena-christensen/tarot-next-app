// Plata by mono (monobank acquiring API v2410) config + fetch helper.
// Docs: https://api.monobank.ua/docs/acquiring.html

import { createVerify } from "crypto";

export const MONO_API_BASE = "https://api.monobank.ua";

export type PaidPlan = "SINGLE" | "MONTHLY" | "YEARLY";

/**
 * ISO 4217 numeric currency code for UAH (hryvnia) — what mono is charged.
 *
 * NOT euro, despite every price being advertised in euros. Ukrainian fiscal
 * receipts (PRRO via Checkbox) and mono's automatic bank integration only
 * fiscalize invoices in 980. An invoice in 978 is accepted and the card is
 * charged, but mono never emits the fiscalization request, so no receipt is
 * ever issued and nothing arrives at Checkbox — which is exactly what happened
 * between 2026-08-05 and 2026-08-07, and what monobank support finally
 * identified. Changing this back breaks fiscal compliance, silently.
 */
export const CCY_UAH = 980;

/** Currency string for `Payment.currency` ledger rows. Matches CCY_UAH. */
export const LEDGER_CURRENCY = "UAH";

/**
 * Advertised prices, in whole euros. DISPLAY ONLY — never sent to mono.
 *
 * The audience is European; hryvnia price tags would read as a foreign, riskier
 * product. So the label stays in euros and the charge goes out in hryvnia.
 */
export const PLAN_PRICES_EUR: Record<PaidPlan, number> = {
  SINGLE: 1,
  MONTHLY: 5,
  YEARLY: 39,
};

/**
 * The euro-to-hryvnia rate the hryvnia prices below are pegged at.
 *
 * Deliberately a fixed peg rather than a live rate looked up per invoice: a
 * live rate puts a network call in the payment path, makes every renewal a
 * different amount, and makes the ledger impossible to reconcile by eye. The
 * cost is drift — as the rate moves, the euro figure stops being exact.
 *
 * RE-PEG when the real rate drifts more than ~5% from this number: change
 * PEG_EUR_UAH and PLAN_PRICES together, nothing else. mono's own rate is at
 * https://api.monobank.ua/bank/currency (currencyCodeA 978, currencyCodeB 980).
 *
 * Set 2026-08-07 against mono's sell rate of 52.07, rounded up for margin.
 */
export const PEG_EUR_UAH = 52.5;

/**
 * Plan prices in minor units (kopiykas) — what is actually charged.
 *
 * PLAN_PRICES_EUR × PEG_EUR_UAH × 100. Kept as literals rather than computed so
 * the exact charged amount is greppable and can never shift under a rounding
 * change.
 */
export const PLAN_PRICES: Record<PaidPlan, number> = {
  SINGLE: 5250, // €1  → ₴52.50
  MONTHLY: 26250, // €5  → ₴262.50
  YEARLY: 204750, // €39 → ₴2047.50
};

/**
 * Fetch wrapper for the mono acquiring API. Adds the X-Token auth header and
 * JSON headers, and throws on any non-2xx response with the body included so
 * callers get a useful error message. Returns the parsed JSON on success.
 */
export async function monoFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = process.env.MONO_ACQUIRING_TOKEN;
  if (!token) {
    throw new Error("[mono] missing MONO_ACQUIRING_TOKEN");
  }

  const res = await fetch(`${MONO_API_BASE}${path}`, {
    ...init,
    headers: {
      "X-Token": token,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(
      `[mono] ${init.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText} — ${body}`
    );
  }

  return (body ? JSON.parse(body) : null) as T;
}

// ---------------------------------------------------------------------------
// Webhook signature verification
//
// Mono signs each webhook with its merchant key. We fetch the public key once
// (GET /api/merchant/pubkey returns { key: base64(PEM) }), cache the decoded
// PEM in module scope, and verify the X-Sign header (base64 ECDSA-SHA256
// signature over the RAW request body). The key can rotate, so on a failed
// verification we force-refresh the key once and retry before rejecting.
// ---------------------------------------------------------------------------

let cachedPubKeyPem: string | null = null;

/**
 * Returns the mono merchant public key as a PEM string, cached in module scope.
 * Pass forceRefresh = true to bypass the cache and refetch (used after a failed
 * signature verification in case the key rotated).
 */
export async function getMonoPubKey(forceRefresh = false): Promise<string> {
  if (cachedPubKeyPem && !forceRefresh) {
    return cachedPubKeyPem;
  }

  const res = await monoFetch<{ key: string }>("/api/merchant/pubkey");
  if (!res?.key) {
    throw new Error("[mono] pubkey response missing `key`");
  }

  // The `key` field is the PEM, base64-encoded — decode to the PEM string.
  cachedPubKeyPem = Buffer.from(res.key, "base64").toString("utf8");
  return cachedPubKeyPem;
}

/**
 * Verifies a mono webhook. The signature in X-Sign is a base64-encoded
 * ECDSA-SHA256 signature computed over the raw request body bytes. On a first
 * failure we force-refresh the cached public key once (handles key rotation)
 * and retry before giving up.
 */
export async function verifyMonoWebhook(
  rawBody: string,
  xSign: string
): Promise<boolean> {
  const signature = Buffer.from(xSign, "base64");

  const attempt = async (forceRefresh: boolean): Promise<boolean> => {
    const pubKeyPem = await getMonoPubKey(forceRefresh);
    const verifier = createVerify("SHA256");
    verifier.write(rawBody);
    verifier.end();
    return verifier.verify(pubKeyPem, signature);
  };

  try {
    if (await attempt(false)) {
      return true;
    }
    // First attempt failed — the key may have rotated. Refresh once and retry.
    return await attempt(true);
  } catch (err) {
    console.error("[mono] webhook verification error", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Merchant-initiated recurring charge (payment by saved card token)
//
// Used by the renewal cron to charge a stored card without the user present.
// Drives the SAME signed webhook as invoice/create, so activation stays in one
// place (src/app/api/payments/webhook/route.ts). Endpoint/body confirmed against
// the acquiring OpenAPI: https://api.monobank.ua/docs/acquiring.html
// ---------------------------------------------------------------------------

export type ChargeByTokenParams = {
  cardToken: string;
  amount: number; // minor units (kopiykas)
  reference: string;
  destination: string;
};

export type ChargeByTokenResult = {
  invoiceId: string;
  status?: string;
};

export async function chargeByToken(
  params: ChargeByTokenParams
): Promise<ChargeByTokenResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("[mono] missing NEXT_PUBLIC_APP_URL");
  }

  return monoFetch<ChargeByTokenResult>("/api/merchant/wallet/payment", {
    method: "POST",
    body: JSON.stringify({
      cardToken: params.cardToken,
      amount: params.amount,
      ccy: CCY_UAH,
      initiationKind: "merchant",
      merchantPaymInfo: {
        reference: params.reference,
        destination: params.destination,
      },
      webHookUrl: `${appUrl}/api/payments/webhook`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Invoice status lookup (GET /api/merchant/invoice/status?invoiceId=...)
//
// Poll the current status of an invoice. Used by the reconciliation cron to
// recover a payment whose webhook never arrived — it reads the true status here
// and applies it through the same path the webhook uses. The response carries
// the same fields the webhook payload does (status + walletData/paymentInfo).
// Endpoint per the acquiring OpenAPI: https://api.monobank.ua/docs/acquiring.html
// ---------------------------------------------------------------------------

export type MonoInvoiceStatus = {
  invoiceId: string;
  status: string;
  amount?: number;
  ccy?: number;
  failureReason?: string;
  walletData?: { cardToken?: string };
  paymentInfo?: { maskedPan?: string; paymentSystem?: string };
};

export async function getInvoiceStatus(
  invoiceId: string
): Promise<MonoInvoiceStatus> {
  return monoFetch<MonoInvoiceStatus>(
    `/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`
  );
}
