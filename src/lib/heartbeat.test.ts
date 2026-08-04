import { describe, it, expect } from "vitest";
import { findStaleJobs, formatSilence, JOB_MAX_SILENCE } from "./heartbeat";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const agoHours = (h: number) => new Date(NOW.getTime() - h * HOUR);

const RULES = { "daily-card": 26 * HOUR, reconcile: 3 * HOUR };

describe("findStaleJobs", () => {
  it("says nothing when every job checked in recently", () => {
    const rows = [
      { job: "daily-card", completedAt: agoHours(8) },
      { job: "reconcile", completedAt: agoHours(1) },
    ];
    expect(findStaleJobs(rows, NOW, RULES)).toEqual([]);
  });

  it("reports a job that has gone quiet past its window", () => {
    const rows = [{ job: "daily-card", completedAt: agoHours(30) }];
    const stale = findStaleJobs(rows, NOW, RULES);
    expect(stale).toHaveLength(1);
    expect(stale[0].job).toBe("daily-card");
    expect(stale[0].silentForMs).toBe(30 * HOUR);
  });

  it("gives a daily job slack so a normal morning never fires it", () => {
    // 25h since yesterday's run is ordinary scheduling drift, not an outage. An
    // alarm that cries wolf gets ignored, and then it isn't an alarm.
    const rows = [{ job: "daily-card", completedAt: agoHours(25) }];
    expect(findStaleJobs(rows, NOW, RULES)).toEqual([]);
  });

  it("holds the hourly job to a much tighter window", () => {
    const rows = [{ job: "reconcile", completedAt: agoHours(4) }];
    expect(findStaleJobs(rows, NOW, RULES).map((s) => s.job)).toEqual([
      "reconcile",
    ]);
  });

  it("ignores a job with no heartbeat at all", () => {
    // Seeded elsewhere instead. Reporting it would fire on every fresh deploy
    // and on every newly added job.
    expect(findStaleJobs([], NOW, RULES)).toEqual([]);
  });

  it("ignores heartbeats for jobs nobody is watching", () => {
    const rows = [{ job: "some-old-job", completedAt: agoHours(500) }];
    expect(findStaleJobs(rows, NOW, RULES)).toEqual([]);
  });

  it("reports several at once", () => {
    const rows = [
      { job: "daily-card", completedAt: agoHours(40) },
      { job: "reconcile", completedAt: agoHours(9) },
    ];
    expect(findStaleJobs(rows, NOW, RULES).map((s) => s.job).sort()).toEqual([
      "daily-card",
      "reconcile",
    ]);
  });

  it("watches every scheduled job", () => {
    // If a cron is added to vercel.json without a window here, it is unmonitored
    // and nothing would ever notice it stopping.
    expect(Object.keys(JOB_MAX_SILENCE).sort()).toEqual([
      "daily-card",
      "reading-reminder",
      "reconcile",
      "renew",
    ]);
  });
});

describe("formatSilence", () => {
  it("reads in hours up to two days", () => {
    expect(formatSilence(30 * HOUR)).toBe("30h");
  });

  it("switches to days beyond that", () => {
    expect(formatSilence(50 * HOUR)).toBe("2d 2h");
  });
});
