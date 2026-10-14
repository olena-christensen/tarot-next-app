import { describe, expect, it } from "vitest";
import { introBootScript, shouldPlayIntro, type IntroInput } from "./intro";

const LOCALES = ["en", "no", "uk", "tr", "ru"] as const;
const base: IntroInput = { path: "/en", navType: "navigate", lastDay: null, today: "2026-10-14", locales: LOCALES };
const play = (over: Partial<IntroInput>) => shouldPlayIntro({ ...base, ...over });

describe("shouldPlayIntro", () => {
  it("plays on the first home-page load of the day", () => {
    expect(play({})).toBe(true);
    expect(play({ lastDay: "2026-10-13" })).toBe(true);
  });

  it("does not play again the same day", () => {
    expect(play({ lastDay: "2026-10-14" })).toBe(false);
  });

  it("plays on reload even if already seen today", () => {
    expect(play({ lastDay: "2026-10-14", navType: "reload" })).toBe(true);
  });

  it("never plays on back/forward", () => {
    expect(play({ navType: "back_forward" })).toBe(false);
  });

  it("recognises every home path form", () => {
    for (const path of ["/", "/en", "/en/", "/uk", "/ru/"]) expect(play({ path })).toBe(true);
  });

  it("never plays on other pages, even on reload", () => {
    for (const path of ["/en/cards", "/cards", "/terms", "/payment/result", "/xx", "/en/game"]) {
      expect(play({ path, navType: "reload" })).toBe(false);
    }
  });

  it("treats an unknown navigation type like a fresh visit", () => {
    expect(play({ navType: undefined })).toBe(true);
    expect(play({ navType: undefined, lastDay: "2026-10-14" })).toBe(false);
  });
});

describe("introBootScript", () => {
  it("is valid JavaScript that inlines the decision function", () => {
    const src = introBootScript(LOCALES);
    expect(() => new Function(src)).not.toThrow();
    expect(src).toContain("theveil_intro_day");
  });
});
