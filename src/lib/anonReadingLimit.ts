/** Daily free readings for an anonymous (not-logged-in) visitor. */
export const ANON_DAILY_LIMIT = 1;

/** localStorage key (mirrors the `theveil_cookie_consent` convention). */
export const ANON_STORAGE_KEY = "theveil_daily_readings";

export type AnonReadingState = { date: string; count: number };

/** UTC calendar date as `YYYY-MM-DD`. */
export function utcDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Pure evaluation of the anonymous daily counter. The stored count is treated
 * as 0 whenever its date is not today (automatic UTC-midnight reset). Returns
 * whether the reading is allowed and the state to persist.
 */
export function evaluateAnonRead(
  stored: AnonReadingState | null,
  now: Date
): { allowed: boolean; next: AnonReadingState } {
  const today = utcDateKey(now);
  const count = stored && stored.date === today ? stored.count : 0;

  if (count >= ANON_DAILY_LIMIT) {
    return { allowed: false, next: { date: today, count } };
  }
  return { allowed: true, next: { date: today, count: count + 1 } };
}
