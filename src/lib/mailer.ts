import nodemailer from "nodemailer";

// Transactional emails for recurring renewal. BEST-EFFORT by contract: every
// send is wrapped so a mail failure can never throw into (and roll back) a
// charge/activation. Reuses the Zoho SMTP setup from the contact route.
// `from` MUST equal the SMTP user — Zoho rejects mismatched envelopes.

function getTransporter(): nodemailer.Transporter | null {
  const user = process.env.ZOHO_SMTP_USER;
  const pass = process.env.ZOHO_SMTP_PASS;
  if (!user || !pass) {
    console.error("[mailer] missing ZOHO_SMTP_USER or ZOHO_SMTP_PASS");
    return null;
  }
  return nodemailer.createTransport({
    host: "smtppro.zoho.eu",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

async function send(subject: string, to: string, text: string): Promise<void> {
  const from = process.env.ZOHO_SMTP_USER;
  const transporter = getTransporter();
  if (!transporter || !from) return; // already logged
  try {
    await transporter.sendMail({ from, to, subject, text });
  } catch (err) {
    console.error("[mailer] sendMail failed", { subject, err });
  }
}

const PLAN_LABEL: Record<"MONTHLY" | "YEARLY", string> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function formatEuro(amountMinor: number): string {
  return `€${(amountMinor / 100).toFixed(2)}`;
}

export async function sendRenewalReceiptEmail(args: {
  to: string;
  planId: "MONTHLY" | "YEARLY";
  amountMinor: number;
  expiresAt: Date;
}): Promise<void> {
  const text = [
    `Your The Veil ${PLAN_LABEL[args.planId]} subscription has renewed.`,
    "",
    `Amount charged: ${formatEuro(args.amountMinor)}`,
    `Your access now continues until ${args.expiresAt.toISOString().slice(0, 10)}.`,
    "",
    "Manage or cancel your subscription any time in your profile.",
    "— The Veil",
  ].join("\n");
  await send("Your The Veil subscription renewed", args.to, text);
}

export async function sendPaymentFailedEmail(args: {
  to: string;
  planId: "MONTHLY" | "YEARLY";
}): Promise<void> {
  const text = [
    `We couldn't charge your card for your The Veil ${PLAN_LABEL[args.planId]} subscription.`,
    "",
    "We'll automatically try again over the next few days. Your access continues",
    "while we retry. To avoid losing access, please update your card details by",
    "starting a new subscription from your profile.",
    "",
    "— The Veil",
  ].join("\n");
  await send("Payment failed — we'll retry your The Veil subscription", args.to, text);
}

export async function sendSubscriptionEndedEmail(args: {
  to: string;
  reason: "canceled" | "payment_failed" | "no_token";
}): Promise<void> {
  const lead =
    args.reason === "canceled"
      ? "Your The Veil subscription has ended, as requested."
      : "Your The Veil subscription has ended because we couldn't renew your payment.";
  const text = [
    lead,
    "",
    "You're now on the free plan. You can resubscribe any time from your profile",
    "to restore full access.",
    "",
    "— The Veil",
  ].join("\n");
  await send("Your The Veil subscription has ended", args.to, text);
}
