/** A reader is nudged once they've been away this long. */
export const IDLE_DAYS = 7;

/** And never more often than this, however long they stay away. */
export const COOLDOWN_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReminderCandidate = {
  /** When they last drew, or null if they never have. */
  lastReadingAt: Date | null;
  /** When they signed up — the clock for someone who has never drawn. */
  createdAt: Date;
  /** UTC day (YYYY-MM-DD) of the last reminder, or null. */
  reminderSentOn: string | null;
};

export type ReminderDecision =
  | { send: true }
  | { send: false; reason: "recently_active" | "cooldown" };

/**
 * Whether to nudge this reader today.
 *
 * Two separate clocks, and both must pass:
 *
 * - **Idle** — nothing drawn for IDLE_DAYS. Someone who has never drawn is
 *   measured from sign-up instead, otherwise a null would either exempt them
 *   forever or mail them the moment they registered.
 * - **Cooldown** — the job runs daily but the nudge must not. Without this a
 *   reader who stays away gets one every morning, which is how a reminder turns
 *   into a reason to unsubscribe.
 *
 * Pure so the rule is testable without a database; the caller supplies `now`.
 */
export function decideReminder(
  input: ReminderCandidate,
  now: Date
): ReminderDecision {
  const since = input.lastReadingAt ?? input.createdAt;
  if (now.getTime() - since.getTime() < IDLE_DAYS * DAY_MS) {
    return { send: false, reason: "recently_active" };
  }

  if (input.reminderSentOn) {
    // Date-only strings compare correctly as UTC midnight.
    const last = new Date(`${input.reminderSentOn}T00:00:00.000Z`).getTime();
    if (!Number.isNaN(last) && now.getTime() - last < COOLDOWN_DAYS * DAY_MS) {
      return { send: false, reason: "cooldown" };
    }
  }

  return { send: true };
}
