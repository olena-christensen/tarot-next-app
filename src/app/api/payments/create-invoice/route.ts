import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CCY_UAH, LEDGER_CURRENCY, PLAN_PRICES, monoFetch } from "@/lib/mono";
import { routing } from "@/i18n/routing";

type PaidPlanId = keyof typeof PLAN_PRICES;

const PAID_PLANS: PaidPlanId[] = ["SINGLE", "MONTHLY", "YEARLY"];

// Plans whose payments should tokenize the card for later recurring charges.
const RECURRING_PLANS: PaidPlanId[] = ["MONTHLY", "YEARLY"];

type MonoInvoiceResponse = {
  invoiceId: string;
  pageUrl: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let planId: unknown;
  let locale: unknown;
  try {
    ({ planId, locale } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof planId !== "string" || !PAID_PLANS.includes(planId as PaidPlanId)) {
    return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
  }
  const plan = planId as PaidPlanId;

  // Checkout is the ONE thing an unverified address blocks (decided 2026-08-04).
  // Reading tarot doesn't need a reachable address; charging someone whose
  // receipt and password-reset would both bounce does. Enforced server-side —
  // the UI hint is cosmetic on top of this.
  const verifyCheck = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!verifyCheck?.emailVerified) {
    return NextResponse.json(
      { error: "email_not_verified" },
      { status: 403 }
    );
  }

  // Route Mono's post-payment redirect to the localized result page. Prefer the
  // locale the client is currently viewing; if it's missing/unrecognized (e.g. a
  // stale bundle), fall back to the user's saved account language — payments are
  // always logged-in, so a Russian account never lands on an English page — and
  // only then to the default locale.
  const isLocale = (v: unknown): v is string =>
    typeof v === "string" && routing.locales.includes(v as any);
  const resultLocale = isLocale(locale)
    ? locale
    : isLocale(session.user.preferredLocale)
      ? session.user.preferredLocale
      : routing.defaultLocale;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("[create-invoice] missing NEXT_PUBLIC_APP_URL");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const amount = PLAN_PRICES[plan];
  // Unique reference to correlate the webhook callback with this user + plan.
  const reference = `${userId}:${plan}:${Date.now()}`;

  const lineItem = `The Veil — ${plan} subscription`;

  // Charged in hryvnia even though the price is advertised in euros — mono only
  // fiscalizes 980. See CCY_UAH in lib/mono.ts.
  const payload: Record<string, unknown> = {
    amount,
    ccy: CCY_UAH,
    merchantPaymInfo: {
      reference,
      destination: lineItem,
      // Mandatory since mono made fiscalization a requirement — omitting it is
      // rejected with INVALID_MERCHANT_PAYM_INFO / "'basketOrder' cannot be
      // empty" (2026-08-05). One line per invoice: `sum` is the whole amount in
      // minor units and must match `amount`, or mono refuses the invoice.
      basketOrder: [
        {
          name: lineItem,
          qty: 1,
          sum: amount,
          unit: "шт.",
          code: plan,
        },
      ],
    },
    redirectUrl: `${appUrl}/${resultLocale}/payment/result`,
    webHookUrl: `${appUrl}/api/payments/webhook`,
    validity: 3600,
  };

  // Tokenize the card for recurring plans so renewals can charge without the
  // user. Harmless to omit for one-time SINGLE purchases.
  if (RECURRING_PLANS.includes(plan)) {
    payload.saveCardData = { saveCard: true };
  }

  let invoice: MonoInvoiceResponse;
  try {
    invoice = await monoFetch<MonoInvoiceResponse>(
      "/api/merchant/invoice/create",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch (err) {
    console.error("[create-invoice] mono invoice create failed", err);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 502 }
    );
  }

  // Record the pending invoice. The plan/tier is NOT activated here — we only
  // record what the user is *trying* to buy via pendingPlanId. The webhook
  // reads pendingPlanId and, on confirmed "success", upgrades the tier or
  // grants a reading credit. Never touch planId or readingCredits before payment.
  try {
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        pendingPlanId: plan,
        monoInvoiceId: invoice.invoiceId,
        paymentStatus: "created",
      },
      update: {
        pendingPlanId: plan,
        monoInvoiceId: invoice.invoiceId,
        paymentStatus: "created",
        // Reset so the webhook's atomic activatedInvoiceId === null guard is
        // correct for repeat purchases (the row persists per user). The new
        // monoInvoiceId also ensures stale deliveries for the prior invoice
        // no longer match.
        activatedInvoiceId: null,
      },
    });
  } catch (err) {
    console.error("[create-invoice] failed to persist subscription", err);
    return NextResponse.json(
      { error: "Failed to record invoice" },
      { status: 500 }
    );
  }

  // Append the payment ledger row. Additive bookkeeping — a failure here must
  // not fail the request: the invoice already exists at Mono and the webhook
  // (which upserts via updateMany) is the source of truth for activation.
  try {
    await prisma.payment.create({
      data: {
        userId,
        monoInvoiceId: invoice.invoiceId,
        reference,
        productType: plan,
        amount,
        currency: LEDGER_CURRENCY,
        status: "created",
      },
    });
  } catch (err) {
    // invoiceId is unique per Mono invoice, so a P2002 collision is unexpected;
    // log and continue either way — the ledger is best-effort.
    console.error("[create-invoice] failed to write payment ledger row", err);
  }

  return NextResponse.json({ pageUrl: invoice.pageUrl });
}
