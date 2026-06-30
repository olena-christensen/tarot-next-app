import { describe, it, expect } from "vitest";
import {
  evaluateAnonRead,
  utcDateKey,
  ANON_DAILY_LIMIT,
} from "./anonReadingLimit";

const NOW = new Date("2026-06-29T15:00:00.000Z");

describe("evaluateAnonRead", () => {
  it("allows the first reading when nothing is stored", () => {
    expect(evaluateAnonRead(null, NOW)).toEqual({
      allowed: true,
      next: { date: "2026-06-29", count: 1 },
    });
  });

  it("blocks once the daily limit is reached today", () => {
    expect(
      evaluateAnonRead({ date: "2026-06-29", count: ANON_DAILY_LIMIT }, NOW)
    ).toEqual({
      allowed: false,
      next: { date: "2026-06-29", count: ANON_DAILY_LIMIT },
    });
  });

  it("resets the count when the stored date is a previous UTC day", () => {
    expect(evaluateAnonRead({ date: "2026-06-28", count: 1 }, NOW)).toEqual({
      allowed: true,
      next: { date: "2026-06-29", count: 1 },
    });
  });

  it("utcDateKey returns the UTC calendar date", () => {
    expect(utcDateKey(NOW)).toBe("2026-06-29");
    // 23:30 in a +offset zone is still the same UTC date here
    expect(utcDateKey(new Date("2026-06-29T23:30:00.000Z"))).toBe("2026-06-29");
  });
});
