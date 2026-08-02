import nodemailer from "nodemailer";
import { getResetEmailStrings } from "./passwordReset";

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

const FROM_NAME = "The Veil";

// Where "unsubscribe" (manage/cancel subscription) points. Locale-agnostic:
// the mailer has no user locale, so use the default-locale profile route.
function profileUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app";
  return `${base.replace(/\/$/, "")}/en/profile`;
}

async function send(
  subject: string,
  to: string,
  text: string,
  opts: {
    html?: string;
    /**
     * Subscription mail advertises List-Unsubscribe; security mail must not —
     * there is nothing to unsubscribe from and offering it invites a user to
     * "opt out" of password resets.
     */
    unsubscribe?: boolean;
  } = {}
): Promise<void> {
  const { html, unsubscribe = true } = opts;
  const address = process.env.ZOHO_SMTP_USER;
  const transporter = getTransporter();
  if (!transporter || !address) return; // already logged
  try {
    // `from` display name + a real address (which MUST equal the SMTP user —
    // Zoho rejects mismatched envelopes; the name doesn't affect the envelope).
    // List-Unsubscribe points at the profile page where the user manages/cancels
    // the subscription — improves inbox placement for subscription mail. No
    // List-Unsubscribe-Post: the profile page is a GET, not a one-click POST
    // endpoint, so we advertise the link only.
    await transporter.sendMail({
      from: { name: FROM_NAME, address },
      to,
      subject,
      text,
      ...(html ? { html } : {}),
      ...(unsubscribe
        ? { headers: { "List-Unsubscribe": `<${profileUrl()}>` } }
        : {}),
    });
  } catch (err) {
    console.error("[mailer] sendMail failed", { subject, err });
  }
}

// Tier names must match what the pricing page sold them (plans.json, Set A).
// The billing period is kept in brackets: a receipt has to be unambiguous about
// what is being charged and how often, which a bare title isn't.
const PLAN_LABEL: Record<"MONTHLY" | "YEARLY", string> = {
  MONTHLY: "Initiate (monthly)",
  YEARLY: "Adept (yearly)",
};

function formatEuro(amountMinor: number): string {
  return `€${(amountMinor / 100).toFixed(2)}`;
}

/**
 * Password-reset link. Localized to the recipient; no List-Unsubscribe (this is
 * security mail, not subscription mail). Best-effort like every send here — the
 * route answers `ok` regardless so a mail failure can't leak account existence.
 */
export async function sendPasswordResetEmail(args: {
  to: string;
  locale: string;
  link: string;
}): Promise<void> {
  const t = await getResetEmailStrings(args.locale);
  const text = [
    t.resetEmailIntro,
    "",
    args.link,
    "",
    t.resetEmailExpiry,
    t.resetEmailIgnore,
    "",
    `— ${FROM_NAME}`,
  ].join("\n");
  const html =
    `<p>${t.resetEmailIntro}</p>` +
    `<p><a href="${args.link}">${t.resetEmailCta}</a></p>` +
    `<p>${t.resetEmailExpiry}</p>` +
    `<p>${t.resetEmailIgnore}</p>`;
  await send(t.resetEmailSubject, args.to, text, { html, unsubscribe: false });
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
