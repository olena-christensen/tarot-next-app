import { sendOpsAlertEmail } from "./mailer";
import { consumeRateLimit, type RateLimitRule } from "./rateLimit";

/**
 * Operational alerts for the scheduled jobs and the payment webhook.
 *
 * Everything here used to only reach `console.error`, which meant a run that
 * mailed nobody looked exactly like a quiet day unless someone opened the Vercel
 * logs. This is the cheapest thing that turns silence into a signal.
 */

/**
 * At most one alert per key per hour.
 *
 * A broken job does not fail once — a lost database, an expired SMTP password or
 * a webhook stuck in a retry loop each produce a continuous stream. Without this
 * the first outage would bury the very inbox it is trying to reach, and the
 * alert would be worse than no alert. Reuses the `RateLimit` table rather than
 * inventing a second counter.
 */
const ALERT_THROTTLE: RateLimitRule = {
  limit: 1,
  windowMs: 60 * 60 * 1000,
  blockMs: 60 * 60 * 1000,
};

/**
 * At most one alert per day for a job that has gone quiet.
 *
 * A job down for 37 hours does not need telling 37 times. The hourly rule above
 * is right for a job that is failing repeatedly — each failure is news. It is
 * wrong for a stale heartbeat, which is the SAME fact restated every hour until
 * someone acts, and which arrives while the operator already knows.
 *
 * Learned 2026-08-06: a dead renew job produced an hourly stream that buried the
 * one email that mattered.
 */
const STALE_JOB_THROTTLE: RateLimitRule = {
  limit: 1,
  windowMs: 24 * 60 * 60 * 1000,
  blockMs: 24 * 60 * 60 * 1000,
};

/** Keys minted by the heartbeat sweep, which restate one fact until it is fixed. */
const STALE_JOB_PREFIX = "heartbeat:";

function alertRecipient(): string {
  return (
    process.env.ALERT_EMAIL ??
    process.env.ZOHO_SMTP_USER ??
    "founder@nothingweird.agency"
  );
}

/**
 * Send an operational alert, throttled per `key`.
 *
 * `key` groups alerts that mean the same thing ("cron:daily-card"), so a job
 * failing every hour mails once an hour rather than once per failure.
 *
 * Best-effort and never throws: an alert that breaks the job it is reporting on
 * would be the worst possible outcome. Callers do not need to wrap it.
 */
export async function alertOps(
  key: string,
  subject: string,
  lines: string[]
): Promise<void> {
  const throttle = key.startsWith(STALE_JOB_PREFIX)
    ? STALE_JOB_THROTTLE
    : ALERT_THROTTLE;

  try {
    const { blocked } = await consumeRateLimit(`alert:${key}`, throttle);
    if (blocked) {
      console.warn("[alert] suppressed (already sent within the window)", { key });
      return;
    }
    await sendOpsAlertEmail({
      to: alertRecipient(),
      subject,
      lines,
    });
  } catch (err) {
    console.error("[alert] failed to send", { key, err });
  }
}

/**
 * Alert only when a run actually reported failures, with the counts inline so
 * the subject alone is usually enough to triage from a phone.
 */
export async function alertOnJobFailures(
  job: string,
  result: Record<string, unknown> & { failed?: number; errors?: number }
): Promise<void> {
  const failed = Number(result.failed ?? result.errors ?? 0);
  if (!failed) return;

  await alertOps(
    `cron:${job}`,
    `[theveil] ${job}: ${failed} failure${failed === 1 ? "" : "s"}`,
    [
      `The ${job} job finished with ${failed} failure(s).`,
      "",
      ...Object.entries(result).map(([k, v]) => `${k}: ${String(v)}`),
      "",
      "Full detail is in the Vercel runtime logs for this function.",
    ]
  );
}
