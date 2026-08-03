import { describe, it, expect } from "vitest";
import {
  decideReminder,
  IDLE_DAYS,
  COOLDOWN_DAYS,
  type ReminderCandidate,
} from "./readingReminder";

const NOW = new Date("2026-08-20T02:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

const cand = (over: Partial<ReminderCandidate> = {}): ReminderCandidate => ({
  lastReadingAt: daysAgo(30),
  createdAt: daysAgo(90),
  reminderSentOn: null,
  ...over,
});

describe("decideReminder", () => {
  it("nudges a reader who has been away long enough", () => {
    expect(decideReminder(cand(), NOW)).toEqual({ send: true });
  });

  it("leaves an active reader alone", () => {
    expect(decideReminder(cand({ lastReadingAt: daysAgo(1) }), NOW)).toEqual({
      send: false,
      reason: "recently_active",
    });
  });

  it("holds until the idle threshold is actually crossed", () => {
    const justInside = cand({ lastReadingAt: daysAgo(IDLE_DAYS - 1) });
    expect(decideReminder(justInside, NOW).send).toBe(false);
    const justOutside = cand({ lastReadingAt: daysAgo(IDLE_DAYS + 1) });
    expect(decideReminder(justOutside, NOW).send).toBe(true);
  });

  it("measures a reader who never drew from their sign-up date", () => {
    // Not exempt forever, and not mailed the day they registered.
    const fresh = cand({ lastReadingAt: null, createdAt: daysAgo(1) });
    expect(decideReminder(fresh, NOW)).toEqual({
      send: false,
      reason: "recently_active",
    });
    const stale = cand({ lastReadingAt: null, createdAt: daysAgo(60) });
    expect(decideReminder(stale, NOW)).toEqual({ send: true });
  });

  it("does not nudge twice inside the cooldown", () => {
    // The job runs daily; without this someone away for a month gets 30 emails.
    const recent = daysAgo(2).toISOString().slice(0, 10);
    expect(decideReminder(cand({ reminderSentOn: recent }), NOW)).toEqual({
      send: false,
      reason: "cooldown",
    });
  });

  it("nudges again once the cooldown has passed", () => {
    const old = daysAgo(COOLDOWN_DAYS + 1).toISOString().slice(0, 10);
    expect(decideReminder(cand({ reminderSentOn: old }), NOW)).toEqual({
      send: true,
    });
  });

  it("ignores an unparseable stamp rather than blocking forever", () => {
    expect(decideReminder(cand({ reminderSentOn: "not-a-date" }), NOW)).toEqual({
      send: true,
    });
  });

  it("checks activity before cooldown — an active reader is never a candidate", () => {
    const active = cand({
      lastReadingAt: daysAgo(1),
      reminderSentOn: daysAgo(1).toISOString().slice(0, 10),
    });
    expect(decideReminder(active, NOW)).toEqual({
      send: false,
      reason: "recently_active",
    });
  });
});
