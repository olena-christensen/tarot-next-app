import { describe, it, expect } from "vitest";
import { renderDailyCardEmail, type DailyCardEmailArgs } from "./dailyCardEmail";

const STRINGS = {
  subject: "{card} — your card for today",
  preheader: "The Veil turned one card while you slept.",
  greeting: "The Veil turned one card while you slept, {name}.",
  greetingAnon: "The Veil turned one card while you slept.",
  cta: "See what {reader} makes of it",
  ctaFallback: "Draw a full reading",
  footerNote: "You receive this because you asked the Veil to speak daily.",
  unsubscribe: "Silence the daily card",
};

const base: DailyCardEmailArgs = {
  name: "Varrokai",
  cardName: "Six of Pentacles",
  cardImageUrl: "https://theveil.app/api/card-image?card=pentacles-6",
  line: "Give or receive today.",
  readerName: "Reginald Ash",
  appUrl: "https://theveil.app/en",
  profileUrl: "https://theveil.app/en/profile",
  wordmark: "The Veil",
  strings: STRINGS,
};

const render = (over: Partial<DailyCardEmailArgs> = {}) =>
  renderDailyCardEmail({ ...base, ...over });

describe("renderDailyCardEmail", () => {
  it("fills the subject and greeting placeholders", () => {
    const { subject, html } = render();
    expect(subject).toBe("Six of Pentacles — your card for today");
    expect(html).toContain("while you slept, Varrokai.");
  });

  it("leaves no unfilled placeholder anywhere", () => {
    const { subject, text, html } = render();
    for (const out of [subject, text, html]) {
      expect(out).not.toMatch(/\{(card|name|reader)\}/);
    }
  });

  it("uses the anonymous greeting when there is no name", () => {
    const { html } = render({ name: null });
    expect(html).toContain(STRINGS.greetingAnon);
    expect(html).not.toContain("{name}");
  });

  it("falls back when the reader can't be resolved", () => {
    // Better a generic call to action than a sentence with a hole in it.
    const { html } = render({ readerName: null });
    expect(html).toContain(STRINGS.ctaFallback);
    expect(html).not.toContain("makes of it");
  });

  it("escapes values so a name can't inject markup", () => {
    const { html } = render({ name: '<script>alert("x")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps the plain-text alternative in step with the HTML", () => {
    const { text } = render();
    expect(text).toContain("SIX OF PENTACLES");
    expect(text).toContain(base.line);
    expect(text).toContain(base.appUrl);
    expect(text).toContain(base.profileUrl);
  });

  it("has no call-to-action button", () => {
    // Deliberate: this is a daily note, not an ad. See the module header.
    const { html } = render();
    expect(html).not.toMatch(/<button/i);
    expect(html).not.toMatch(/border-radius/i);
  });

  it("uses only absolute URLs — a relative one is dead in a mail client", () => {
    const { html } = render();
    for (const href of html.match(/(?:href|src)="([^"]+)"/g) ?? []) {
      expect(href).toMatch(/="https?:\/\//);
    }
  });
});
