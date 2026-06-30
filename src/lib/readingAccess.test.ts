import { describe, it, expect } from "vitest";
import {
  decideReadingAccess,
  utcMidnight,
  FREE_DAILY_LIMIT,
  type ReadingAccessInput,
} from "./readingAccess";

const NOW = new Date("2026-06-29T15:00:00.000Z");

function input(overrides: Partial<ReadingAccessInput> = {}): ReadingAccessInput {
  return {
    planId: "FREE",
    expiresAt: null,
    readingsToday: 0,
    readingCredits: 0,
    ...overrides,
  };
}

describe("decideReadingAccess", () => {
  it("active MONTHLY bypasses counting", () => {
    const expiresAt = new Date(NOW.getTime() + 86_400_000);
    expect(decideReadingAccess(input({ planId: "MONTHLY", expiresAt }), NOW)).toEqual({
      mode: "subscription",
    });
  });

  it("active YEARLY bypasses counting", () => {
    const expiresAt = new Date(NOW.getTime() + 86_400_000);
    expect(decideReadingAccess(input({ planId: "YEARLY", expiresAt }), NOW)).toEqual({
      mode: "subscription",
    });
  });

  it("expired MONTHLY falls back to the free path", () => {
    const expiresAt = new Date(NOW.getTime() - 86_400_000);
    expect(decideReadingAccess(input({ planId: "MONTHLY", expiresAt }), NOW)).toEqual({
      mode: "free",
      remaining: FREE_DAILY_LIMIT - 1,
    });
  });

  it("FREE under the daily limit is a free reading with remaining count", () => {
    expect(decideReadingAccess(input({ readingsToday: 1 }), NOW)).toEqual({
      mode: "free",
      remaining: 1,
    });
  });

  it("the last free reading reports remaining 0", () => {
    expect(decideReadingAccess(input({ readingsToday: 2 }), NOW)).toEqual({
      mode: "free",
      remaining: 0,
    });
  });

  it("at the limit with credits → credit mode", () => {
    expect(decideReadingAccess(input({ readingsToday: 3, readingCredits: 2 }), NOW)).toEqual({
      mode: "credit",
    });
  });

  it("at the limit with no credits → blocked", () => {
    expect(decideReadingAccess(input({ readingsToday: 3, readingCredits: 0 }), NOW)).toEqual({
      mode: "blocked",
      reason: "limit_reached",
    });
  });

  it("utcMidnight zeroes the time at the start of the UTC day", () => {
    expect(utcMidnight(NOW).toISOString()).toBe("2026-06-29T00:00:00.000Z");
  });
});
