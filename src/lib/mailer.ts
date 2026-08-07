import nodemailer from "nodemailer";
import { getResetEmailStrings } from "./passwordReset";
import { getVerifyEmailStrings } from "./emailVerification";
import { routing } from "@/i18n/routing";
import {
  renderDailyCardEmail,
  type DailyCardEmailStrings,
} from "./dailyCardEmail";
import {
  renderReminderEmail,
  type ReminderEmailStrings,
} from "./reminderEmail";

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

/**
 * Returns whether SMTP ACCEPTED the message — not whether it was delivered, which
 * no sender can know synchronously. Errors are still swallowed (every caller here
 * is best-effort by contract and must not throw into a charge or a route), but a
 * caller that reports counts can now distinguish "sent" from "attempted". Callers
 * that don't care may ignore the value.
 */
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
): Promise<boolean> {
  const { html, unsubscribe = true } = opts;
  const address = process.env.ZOHO_SMTP_USER;
  const transporter = getTransporter();
  if (!transporter || !address) return false; // already logged
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
    return true;
  } catch (err) {
    console.error("[mailer] sendMail failed", { subject, err });
    return false;
  }
}

/**
 * "Initiate (monthly)" in the recipient's language.
 *
 * Tier names must match what the pricing page sold them, so the NAME comes from
 * `plans.json` rather than being duplicated here; only the billing word is a
 * separate key. The period stays in brackets because a receipt has to be
 * unambiguous about what is charged and how often, which a bare title isn't.
 */
async function planLabel(
  locale: string,
  planId: "MONTHLY" | "YEARLY"
): Promise<string> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const [plans, ui] = await Promise.all([
    import(`../../messages/${safe}/plans.json`).then((m) => m.default),
    import(`../../messages/${safe}/ui.json`).then((m) => m.default),
  ]);
  const name = plans.plans?.[planId]?.name ?? planId;
  const period =
    planId === "MONTHLY" ? ui.ui.billingMonthly : ui.ui.billingYearly;
  return `${name} (${period})`;
}

/** Payment-email copy in the recipient's language. */
async function paymentStrings(locale: string): Promise<Record<string, string>> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${safe}/ui.json`)).default;
  return messages.ui as Record<string, string>;
}

function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);
}

/**
 * The amount line on a receipt.
 *
 * Shows BOTH numbers, deliberately: the euro price the customer agreed to, and
 * the hryvnia amount their card was actually charged. Since 2026-08-07 those
 * are different — mono only fiscalizes invoices in hryvnia (see CCY_UAH), so
 * the charge goes out in ₴ while the price tag stays in €. Printing only the
 * euro figure would make the receipt contradict the customer's bank statement.
 */
function formatCharged(amountMinorUah: number, amountEur: number): string {
  return `€${amountEur.toFixed(2)} (₴${(amountMinorUah / 100).toFixed(2)})`;
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
  locale: string;
  planId: "MONTHLY" | "YEARLY";
  /** Hryvnia minor units — what the card was actually charged. */
  amountMinor: number;
  /** Whole euros — the advertised price. */
  amountEur: number;
  expiresAt: Date;
}): Promise<void> {
  const t = await paymentStrings(args.locale);
  const plan = await planLabel(args.locale, args.planId);
  const text = [
    fillTemplate(t.renewalIntro, { plan }),
    "",
    fillTemplate(t.renewalAmount, {
      amount: formatCharged(args.amountMinor, args.amountEur),
    }),
    fillTemplate(t.renewalUntil, {
      date: args.expiresAt.toISOString().slice(0, 10),
    }),
    "",
    t.renewalManage,
    `— ${FROM_NAME}`,
  ].join("\n");
  await send(fillTemplate(t.renewalSubject, { plan }), args.to, text);
}

export async function sendPaymentFailedEmail(args: {
  to: string;
  locale: string;
  planId: "MONTHLY" | "YEARLY";
}): Promise<void> {
  const t = await paymentStrings(args.locale);
  const plan = await planLabel(args.locale, args.planId);
  const text = [
    fillTemplate(t.paymentFailedIntro, { plan }),
    "",
    t.paymentFailedRetry,
    "",
    `— ${FROM_NAME}`,
  ].join("\n");
  await send(t.paymentFailedSubject, args.to, text);
}

export async function sendSubscriptionEndedEmail(args: {
  to: string;
  locale: string;
  reason: "canceled" | "payment_failed" | "no_token";
}): Promise<void> {
  const t = await paymentStrings(args.locale);
  const text = [
    args.reason === "canceled" ? t.subEndedCanceled : t.subEndedFailed,
    "",
    t.subEndedFree,
    "",
    `— ${FROM_NAME}`,
  ].join("\n");
  await send(t.subEndedSubject, args.to, text);
}

/**
 * The daily card. Subscription mail, so List-Unsubscribe is on (it points at the
 * profile, where the toggle lives — no separate unauthenticated opt-out route).
 *
 * Card art is served as PNG by `/api/card-image`: the deck is WebP and Outlook
 * desktop can't render it.
 *
 * The body itself lives in `dailyCardEmail.ts` so it can be rendered and looked
 * at without sending — see that file for why it is shaped the way it is.
 *
 * Returns whether SMTP accepted the message, so the cron can count real sends.
 */
export async function sendDailyCardEmail(args: {
  to: string;
  name: string | null;
  cardName: string;
  cardImageUrl: string;
  line: string;
  readerName: string | null;
  appUrl: string;
  strings: DailyCardEmailStrings;
}): Promise<boolean> {
  const { subject, text, html } = renderDailyCardEmail({
    ...args,
    profileUrl: profileUrl(),
    wordmark: FROM_NAME,
  });
  return send(subject, args.to, text, { html });
}

/**
 * The "you haven't drawn in a while" nudge. Subscription mail, so
 * List-Unsubscribe is on. Body lives in `reminderEmail.ts`.
 *
 * Returns whether SMTP accepted the message, so the cron can count real sends.
 */
export async function sendReadingReminderEmail(args: {
  to: string;
  name: string | null;
  appUrl: string;
  strings: ReminderEmailStrings;
}): Promise<boolean> {
  const { subject, text, html } = renderReminderEmail({
    ...args,
    profileUrl: profileUrl(),
    wordmark: FROM_NAME,
  });
  return send(subject, args.to, text, { html });
}

/**
 * Operational alert to the operator, not to a user.
 *
 * Plain text and no `List-Unsubscribe`: this is not subscription mail, and an
 * unsubscribe link on your own outage alerts is an invitation to silence them.
 * Returns whether SMTP accepted it — if the alert itself can't be sent, the
 * caller logs that rather than pretending it went.
 */
export async function sendOpsAlertEmail(args: {
  to: string;
  subject: string;
  lines: string[];
}): Promise<boolean> {
  const text = [...args.lines, "", `— ${FROM_NAME}`].join("\n");
  return send(args.subject, args.to, text, { unsubscribe: false });
}

/**
 * Email-verification link. Localized to the recipient; no `List-Unsubscribe` —
 * like the password reset this is account mail, not subscription mail, and you
 * cannot opt out of being asked to confirm your own address.
 */
export async function sendVerificationEmail(args: {
  to: string;
  locale: string;
  link: string;
}): Promise<boolean> {
  const t = await getVerifyEmailStrings(args.locale);
  const text = [
    t.verifyEmailIntro,
    "",
    args.link,
    "",
    t.verifyEmailExpiry,
    t.verifyEmailIgnore,
    "",
    `— ${FROM_NAME}`,
  ].join("\n");
  const html =
    `<p>${t.verifyEmailIntro}</p>` +
    `<p><a href="${args.link}">${t.verifyEmailCta}</a></p>` +
    `<p>${t.verifyEmailExpiry}</p>` +
    `<p>${t.verifyEmailIgnore}</p>`;
  return send(t.verifyEmailSubject, args.to, text, { html, unsubscribe: false });
}
