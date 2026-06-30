import type { PlanId } from "./plans";

/** Daily free readings for a logged-in FREE user. */
export const FREE_DAILY_LIMIT = 3;

/** Start of the current UTC day — the daily-count boundary. */
export function utcMidnight(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export type ReadingAccessInput = {
  planId: PlanId;
  /** Paid-period end, or null. */
  expiresAt: Date | null;
  /** Reading rows already written today (UTC). */
  readingsToday: number;
  /** Current consumable credit balance. */
  readingCredits: number;
};

export type ReadingAccess =
  | { mode: "subscription" }
  | { mode: "free"; remaining: number }
  /** Free allotment exhausted; snapshot shows credits — caller must atomically confirm the spend. */
  | { mode: "credit" }
  | { mode: "blocked"; reason: "limit_reached" };

/**
 * Pure entitlement decision. Priority: active subscriber → free-under-limit →
 * credit → blocked. SINGLE is never a planId (it only adds credits), so only
 * MONTHLY/YEARLY count as a tier here.
 */
export function decideReadingAccess(
  input: ReadingAccessInput,
  now: Date
): ReadingAccess {
  const activeTier =
    (input.planId === "MONTHLY" || input.planId === "YEARLY") &&
    input.expiresAt !== null &&
    input.expiresAt.getTime() > now.getTime();

  if (activeTier) return { mode: "subscription" };

  if (input.readingsToday < FREE_DAILY_LIMIT) {
    return { mode: "free", remaining: FREE_DAILY_LIMIT - (input.readingsToday + 1) };
  }

  if (input.readingCredits > 0) return { mode: "credit" };

  return { mode: "blocked", reason: "limit_reached" };
}
