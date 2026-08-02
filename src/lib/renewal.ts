// Pure dunning state machine for recurring renewal. No DB, no network, no clock
// access — `now` is injected — so every branch is unit-testable. The cron in
// src/app/api/cron/renew/route.ts loads each MONTHLY/YEARLY subscription and
// applies the action this returns. See docs/superpowers/specs/2026-06-28-recurring-renewal-design.md §7.

export const GRACE_MAX_RETRIES = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How far BEFORE `nextChargeAt` a renewal becomes chargeable — i.e. bill in
 * advance rather than at the deadline.
 *
 * Without this, a subscription whose renewal moment falls after the cron's
 * daily run is expired and locked out until the next run — up to ~24h of paid
 * downtime (observed live 2026-08-02). The cron can only run once a day on
 * Vercel Hobby, with ±59 min imprecision, so the lead time — not a faster
 * schedule — is what guarantees the charge lands before access ends.
 */
export const RENEWAL_LEAD_MS = 24 * 60 * 60 * 1000;

export type RenewalInput = {
  autoRenew: boolean;
  planId: string;
  expiresAt: Date | null;
  nextChargeAt: Date | null;
  monoCardToken: string | null;
  paymentStatus: string | null;
  renewalAttempts: number;
  lastRenewalAttemptAt: Date | null;
};

export type RenewalAction =
  | { type: "none" }
  | { type: "downgrade"; reason: "canceled" | "no_token" | "payment_failed" }
  | { type: "charge" };

export function decideRenewalAction(sub: RenewalInput, now: Date): RenewalAction {
  const periodOver = sub.expiresAt != null && now >= sub.expiresAt;

  // Canceled: keep access until the period ends, then downgrade.
  if (!sub.autoRenew) {
    return periodOver ? { type: "downgrade", reason: "canceled" } : { type: "none" };
  }

  // No saved token: nothing to charge. Lapse once the period is over.
  if (!sub.monoCardToken) {
    return periodOver ? { type: "downgrade", reason: "no_token" } : { type: "none" };
  }

  // Retries exhausted on a confirmed failure → give up. The retry cap IS the
  // grace boundary (up to GRACE_MAX_RETRIES daily attempts; access continues
  // through them even past expiresAt).
  if (
    sub.renewalAttempts >= GRACE_MAX_RETRIES &&
    (sub.paymentStatus === "failure" || sub.paymentStatus === "reversed")
  ) {
    return { type: "downgrade", reason: "payment_failed" };
  }

  // Charge up to RENEWAL_LEAD_MS early so the daily cron always gets an attempt
  // in before the period ends. Downgrade branches above still key off the real
  // expiry — nobody is demoted early, only billed early.
  const renewalDue =
    sub.nextChargeAt != null &&
    now.getTime() >= sub.nextChargeAt.getTime() - RENEWAL_LEAD_MS;
  if (!renewalDue) return { type: "none" };

  // A charge is already in flight for the current invoice — never double-charge.
  if (sub.paymentStatus === "created" || sub.paymentStatus === "processing") {
    return { type: "none" };
  }

  // At most one attempt per subscription per day.
  const spacedOk =
    sub.renewalAttempts === 0 ||
    sub.lastRenewalAttemptAt == null ||
    now.getTime() - sub.lastRenewalAttemptAt.getTime() >= DAY_MS;
  if (!spacedOk) return { type: "none" };

  return { type: "charge" };
}
