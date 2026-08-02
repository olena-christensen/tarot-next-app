import { describe, it, expect } from "vitest";
import { pickDailyCard, utcDayKey } from "./dailyCard";
import { tarots } from "@/data";

describe("utcDayKey", () => {
  it("returns the UTC calendar day", () => {
    expect(utcDayKey(new Date("2026-08-02T02:00:00.000Z"))).toBe("2026-08-02");
  });

  it("uses UTC, not local time, near midnight", () => {
    expect(utcDayKey(new Date("2026-08-02T23:59:59.999Z"))).toBe("2026-08-02");
    expect(utcDayKey(new Date("2026-08-03T00:00:00.000Z"))).toBe("2026-08-03");
  });
});

describe("pickDailyCard", () => {
  it("is stable for the same user and day", () => {
    // The whole point: a cron retry must not mail a second, different card.
    const a = pickDailyCard("user_abc", "2026-08-02");
    const b = pickDailyCard("user_abc", "2026-08-02");
    expect(a.id).toBe(b.id);
  });

  it("returns a real card from the deck", () => {
    const card = pickDailyCard("user_abc", "2026-08-02");
    expect(tarots.some((t) => t.id === card.id)).toBe(true);
  });

  it("differs across days for one user", () => {
    const days = ["2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05"];
    const ids = new Set(days.map((d) => pickDailyCard("user_abc", d).id));
    expect(ids.size).toBeGreaterThan(1);
  });

  it("differs across users on one day", () => {
    const users = ["user_a", "user_b", "user_c", "user_d"];
    const ids = new Set(users.map((u) => pickDailyCard(u, "2026-08-02").id));
    expect(ids.size).toBeGreaterThan(1);
  });

  it("spreads across the whole deck", () => {
    // 78 cards, 5000 users: every card should come up, and none should dominate.
    const counts = new Map<string, number>();
    for (let i = 0; i < 5000; i++) {
      const id = pickDailyCard(`user_${i}`, "2026-08-02").id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(counts.size).toBe(tarots.length);
    const max = Math.max(...Array.from(counts.values()));
    // Even split is ~64; allow generous slack, catch only a real skew.
    expect(max).toBeLessThan(130);
  });
});
