import { routing } from "@/i18n/routing";

/**
 * The "you haven't drawn in a while" nudge.
 *
 * Same construction rules as `dailyCardEmail.ts` — inline styles on nested
 * tables, absolute URLs, flat hexes because Outlook drops `rgba()` — and the
 * same deliberate absence of a call-to-action button. No card art: this email is
 * about the deck being untouched, and showing a card would give away the one
 * thing worth opening the app for.
 */

const BG = "#090909";
const GOLD = "#fae1a3";
const GOLD_SOFT = "#cfba85";
const GOLD_FAINT = "#8a7d5e";
const RULE = "#2a2419";
const RULE_LINK = "#5c4f33";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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

function spacer(height: number): string {
  return `<tr><td style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</td></tr>`;
}

export type ReminderEmailStrings = {
  subject: string;
  preheader: string;
  greeting: string;
  greetingAnon: string;
  body: string;
  cta: string;
  footerNote: string;
  unsubscribe: string;
};

/**
 * Reminder copy for one locale. Imported directly rather than through next-intl,
 * which has no hooks in a cron route — the same approach as `getDailyStrings`.
 * Not registered in `src/i18n/request.ts`: nothing in the app UI reads it.
 */
export async function getReminderStrings(
  locale: string
): Promise<ReminderEmailStrings> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${safe}/reminder.json`)).default;
  return messages.reminder as ReminderEmailStrings;
}

export type ReminderEmailArgs = {
  name: string | null;
  appUrl: string;
  profileUrl: string;
  wordmark: string;
  strings: ReminderEmailStrings;
};

export function renderReminderEmail(args: ReminderEmailArgs): {
  subject: string;
  text: string;
  html: string;
} {
  const s = args.strings;
  const greeting = args.name
    ? fill(s.greeting, { name: args.name })
    : s.greetingAnon;

  const text = [
    greeting,
    "",
    s.body,
    "",
    `${s.cta}: ${args.appUrl}`,
    "",
    s.footerNote,
    `${s.unsubscribe}: ${args.profileUrl}`,
    `— ${args.wordmark}`,
  ].join("\n");

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background-color:${BG};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:36px 16px 44px;">
      <span style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;color:${BG};">${esc(s.preheader)}</span>
      <table role="presentation" width="460" cellpadding="0" cellspacing="0" border="0" style="width:460px;max-width:100%;">
        <tr>
          <td align="center" style="font-family:${FONT};font-size:11px;letter-spacing:0.38em;text-transform:uppercase;color:${GOLD};">
            ${esc(args.wordmark)}
          </td>
        </tr>
        ${spacer(30)}
        <tr>
          <td align="center" style="font-family:${FONT};font-size:19px;letter-spacing:0.06em;color:${GOLD};">
            ${esc(greeting)}
          </td>
        </tr>
        ${spacer(20)}
        <tr>
          <td align="center" style="font-family:${FONT};font-size:16px;line-height:1.75;color:${GOLD_SOFT};padding:0 20px;">
            ${esc(s.body)}
          </td>
        </tr>
        ${spacer(30)}
        <tr>
          <td align="center" style="font-family:${FONT};font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">
            <a href="${esc(args.appUrl)}" style="color:${GOLD};text-decoration:none;border-bottom:1px solid ${RULE_LINK};padding-bottom:5px;">${esc(s.cta)}</a>
          </td>
        </tr>
        ${spacer(38)}
        <tr>
          <td style="height:1px;line-height:1px;font-size:0;background-color:${RULE};">&nbsp;</td>
        </tr>
        ${spacer(16)}
        <tr>
          <td align="center" style="font-family:${FONT};font-size:11px;line-height:1.7;color:${GOLD_FAINT};">
            ${esc(s.footerNote)}<br />
            <a href="${esc(args.profileUrl)}" style="color:${GOLD_FAINT};">${esc(s.unsubscribe)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();

  return { subject: s.subject, text, html };
}
