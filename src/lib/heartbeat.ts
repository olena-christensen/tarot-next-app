import { prisma } from "./prisma";

/**
 * Dead-man's switch for the scheduled jobs.
 *
 * `alertOnJobFailures` only fires when a job RUNS and reports failures. A job
 * that stops being called at all — a cron dropped by a deploy, a broken
 * schedule — says nothing, and silence is indistinguishable from success. This
 * inverts the burden: each job proves it is alive, and the hourly sweep
 * complains about the ones that have gone quiet.
 */

const HOUR = 60 * 60 * 1000;

/**
 * How long each job may go without checking in before it counts as stale.
 *
 * Daily jobs get 26h rather than 24 so ordinary scheduling slack doesn't cry
 * wolf; an alarm that fires on a normal morning gets ignored, and then it isn't
 * an alarm any more.
 */
export const JOB_MAX_SILENCE: Record<string, number> = {
  "daily-card": 26 * HOUR,
  "reading-reminder": 26 * HOUR,
  renew: 26 * HOUR,
  // Hourly, so a much tighter window. Checked BEFORE the sweep stamps its own
  // heartbeat, which is what lets it report "I was down and have just come back".
  reconcile: 3 * HOUR,
};

export type HeartbeatRow = { job: string; completedAt: Date };

export type StaleJob = {
  job: string;
  lastSeen: Date;
  silentForMs: number;
  allowedMs: number;
};

/**
 * Which jobs have gone quiet for longer than they're allowed.
 *
 * Pure, so the rule is testable without a database. A job with NO row is not
 * reported — see `checkJobHeartbeats`, which seeds one instead. Alerting about a
 * job that has simply never run yet would fire on every fresh deploy.
 */
export function findStaleJobs(
  rows: HeartbeatRow[],
  now: Date,
  expectations: Record<string, number> = JOB_MAX_SILENCE
): StaleJob[] {
  const byJob = new Map(rows.map((r) => [r.job, r.completedAt]));
  const stale: StaleJob[] = [];

  for (const [job, allowedMs] of Object.entries(expectations)) {
    const lastSeen = byJob.get(job);
    if (!lastSeen) continue;
    const silentForMs = now.getTime() - lastSeen.getTime();
    if (silentForMs > allowedMs) {
      stale.push({ job, lastSeen, silentForMs, allowedMs });
    }
  }

  return stale;
}

/** Human-readable gap, for the alert body. */
export function formatSilence(ms: number): string {
  const hours = Math.floor(ms / HOUR);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/**
 * Stamp a job as alive. Called at the END of a run, so a job that crashes
 * halfway does not claim to have finished.
 *
 * Best-effort: a heartbeat that fails to write must not fail the job it is
 * monitoring.
 */
export async function recordHeartbeat(
  job: string,
  detail?: unknown
): Promise<void> {
  try {
    const text = detail === undefined ? null : JSON.stringify(detail).slice(0, 500);
    await prisma.jobHeartbeat.upsert({
      where: { job },
      create: { job, completedAt: new Date(), detail: text },
      update: { completedAt: new Date(), detail: text },
    });
  } catch (err) {
    console.error("[heartbeat] failed to record", { job, err });
  }
}

/**
 * Read every heartbeat and return the ones that have gone quiet.
 *
 * Jobs with no row yet are **seeded** at `now` and not reported — that starts
 * their clock without firing an alert the first time this ships, or the first
 * time a new job is added. The cost is one quiet cycle before a job that has
 * never run once is noticed.
 */
export async function checkJobHeartbeats(
  now: Date = new Date()
): Promise<StaleJob[]> {
  try {
    const rows = await prisma.jobHeartbeat.findMany({
      select: { job: true, completedAt: true },
    });
    const known = new Set(rows.map((r) => r.job));

    const missing = Object.keys(JOB_MAX_SILENCE).filter((j) => !known.has(j));
    if (missing.length) {
      await prisma.jobHeartbeat.createMany({
        data: missing.map((job) => ({ job, completedAt: now })),
        skipDuplicates: true,
      });
    }

    return findStaleJobs(rows, now);
  } catch (err) {
    // Never let the watchman break the job it is riding along with.
    console.error("[heartbeat] check failed", err);
    return [];
  }
}
