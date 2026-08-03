/**
 * The daily card email's body. Split out of `mailer.ts` so it can be rendered and
 * inspected without sending anything — a mail template that can only be seen by
 * mailing it to yourself gets designed blind.
 *
 * Email HTML is not web HTML: no stylesheet is loaded, no flexbox or grid
 * survives, and Outlook still lays out with tables. Everything here is inline
 * styles on nested tables, absolute URLs, and hex colours — `rgba()` is avoided
 * because Outlook desktop drops it, which would leave text at its default colour
 * on a near-black background.
 *
 * **No call-to-action button, by choice.** Not for deliverability — the earlier
 * theory that plain markup would win Gmail's Primary tab was tested and failed
 * (2026-08-03). Placement is driven by sender reputation and the recipient's own
 * engagement history far more than by markup. The link stays a link because this
 * is a daily note, not an ad.
 */

// The app palette, as flat hexes. Mirrors `_variables.scss`; the alpha variants
// are pre-composited against the dark background because rgba() is unreliable.
const BG = "#090909";
const GOLD = "#fae1a3";
const GOLD_SOFT = "#cfba85";
const GOLD_FAINT = "#8a7d5e";
const RULE = "#2a2419";
// The CTA's underline needs to be brighter than the hairline rule — at RULE's
// value it vanished against the background and the link stopped reading as one.
const RULE_LINK = "#5c4f33";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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

/** Vertical space that survives Outlook, which ignores margins on block elements. */
function spacer(height: number): string {
  return `<tr><td style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</td></tr>`;
}

export type DailyCardEmailStrings = {
  subject: string;
  preheader: string;
  greeting: string;
  greetingAnon: string;
  cta: string;
  ctaFallback: string;
  footerNote: string;
  unsubscribe: string;
};

export type DailyCardEmailArgs = {
  name: string | null;
  cardName: string;
  cardImageUrl: string;
  line: string;
  readerName: string | null;
  appUrl: string;
  profileUrl: string;
  wordmark: string;
  strings: DailyCardEmailStrings;
};

export function renderDailyCardEmail(args: DailyCardEmailArgs): {
  subject: string;
  text: string;
  html: string;
} {
  const s = args.strings;
  const subject = fill(s.subject, { card: args.cardName });
  const greeting = args.name
    ? fill(s.greeting, { name: args.name })
    : s.greetingAnon;
  // Falls back when the reader can't be resolved for this locale — never render
  // a sentence with a hole in it.
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
          <td align="center" style="font-family:${FONT};font-size:15px;line-height:1.7;color:${GOLD_SOFT};">
            ${esc(greeting)}
          </td>
        </tr>
        ${spacer(28)}
        <!--
          TEST, 2026-08-03 — card image removed on purpose.

          The reminder email reaches Gmail's Primary tab and this one does not,
          and the two differ in exactly two ways: the image, and the subject.
          Rewriting the subject as a sentence changed nothing, which leaves the
          image as the only untested variable.

          args.cardImageUrl is still passed in so restoring this is one line.
          PUT IT BACK once the answer is known — the card is the point of the
          email — unless the image turns out to be what costs the Primary tab
          and that trade is accepted deliberately.
        -->
        ${spacer(22)}
        <tr>
          <td align="center" style="font-family:${FONT};font-size:19px;letter-spacing:0.1em;color:${GOLD};">
            ${esc(args.cardName)}
          </td>
        </tr>
        ${spacer(16)}
        <tr>
          <td align="center" style="font-family:${FONT};font-size:16px;line-height:1.75;color:${GOLD_SOFT};padding:0 20px;">
            ${esc(args.line)}
          </td>
        </tr>
        ${spacer(30)}
        <tr>
          <td align="center" style="font-family:${FONT};font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">
            <a href="${esc(args.appUrl)}" style="color:${GOLD};text-decoration:none;border-bottom:1px solid ${RULE_LINK};padding-bottom:5px;">${esc(cta)}</a>
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

  return { subject, text, html };
}
