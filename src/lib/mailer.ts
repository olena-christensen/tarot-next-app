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

/** Minimal HTML escape for values interpolated into the mail body. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

/**
 * The daily card. Subscription mail, so List-Unsubscribe is on (it points at the
 * profile, where the toggle lives — no separate unauthenticated opt-out route).
 *
 * Card art is served as PNG by `/api/card-image`: the deck is WebP and Outlook
 * desktop can't render it. Every mail client also needs absolute URLs and inline
 * styles — no stylesheet is loaded, so the markup here stays deliberately plain.
 *
 * Best-effort like every send in this file: `send()` swallows SMTP errors, and
 * the caller counts outcomes rather than trusting a throw.
 */
export async function sendDailyCardEmail(args: {
  to: string;
  name: string | null;
  cardName: string;
  cardImageUrl: string;
  line: string;
  readerName: string | null;
  appUrl: string;
  strings: {
    subject: string;
    preheader: string;
    greeting: string;
    greetingAnon: string;
    cta: string;
    ctaFallback: string;
    footerNote: string;
    unsubscribe: string;
  };
}): Promise<void> {
  const s = args.strings;
  const subject = fill(s.subject, { card: args.cardName });
  const greeting = args.name
    ? fill(s.greeting, { name: args.name })
    : s.greetingAnon;
  const cta = args.readerName
    ? fill(s.cta, { reader: args.readerName })
    : s.ctaFallback;

  const text = [
    greeting,
    "",
    args.cardName.toUpperCase(),
    args.line,
    "",
    `${cta}: ${args.appUrl}`,
    "",
    s.footerNote,
    `${s.unsubscribe}: ${profileUrl()}`,
    `— ${FROM_NAME}`,
  ].join("\n");

  const html = `
<div style="margin:0;padding:0;background:#090909;">
  <span style="display:none;font-size:0;line-height:0;color:#090909;">${esc(s.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#090909;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;color:rgba(250,225,163,0.9);font-size:16px;line-height:1.6;padding-bottom:24px;">
          ${esc(greeting)}
        </td></tr>
        <tr><td align="center" style="padding-bottom:20px;">
          <img src="${esc(args.cardImageUrl)}" width="260" alt="${esc(args.cardName)}" style="display:block;width:260px;max-width:100%;height:auto;border:0;" />
        </td></tr>
        <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;color:#fae1a3;font-size:22px;letter-spacing:0.06em;padding-bottom:12px;">
          ${esc(args.cardName)}
        </td></tr>
        <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;color:rgba(250,225,163,0.9);font-size:16px;line-height:1.7;padding-bottom:28px;">
          ${esc(args.line)}
        </td></tr>
        <tr><td align="center" style="padding-bottom:28px;">
          <a href="${esc(args.appUrl)}" style="display:inline-block;font-family:Georgia,'Times New Roman',serif;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;color:#fae1a3;text-decoration:none;border:1px solid #fae1a3;border-radius:4px;padding:12px 24px;">
            ${esc(cta)}
          </a>
        </td></tr>
        <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;color:rgba(250,225,163,0.55);font-size:12px;line-height:1.6;">
          ${esc(s.footerNote)}<br />
          <a href="${esc(profileUrl())}" style="color:rgba(250,225,163,0.55);">${esc(s.unsubscribe)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`.trim();

  await send(subject, args.to, text, { html });
}
