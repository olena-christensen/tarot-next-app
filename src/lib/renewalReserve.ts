import { prisma } from "@/lib/prisma";

// Reserves one renewal charge for the renewal cron (code review 2026-10-15,
// item 2).
//
// The cron reads every paid subscription first and charges afterwards. Vercel
// can start the same cron twice; both runs then hold the same snapshot, both see
// "nothing in flight", and an unconditional reserve let BOTH charge the card.
//
// So the reserve is conditional on the attempt bookkeeping still being exactly
// what this run read. Every reserve bumps `renewalAttempts` and stamps
// `lastRenewalAttemptAt`, so the first run to write changes both and any other
// run holding the old snapshot matches no row. The cron charges only when this
// returns true — exactly one row changed.

export type RenewalSnapshot = {
  id: string;
  renewalAttempts: number;
  lastRenewalAttemptAt: Date | null;
};

export async function reserveRenewalAttempt(
  sub: RenewalSnapshot,
  plan: "MONTHLY" | "YEARLY",
  now: Date
): Promise<boolean> {
  const { count } = await prisma.subscription.updateMany({
    where: {
      id: sub.id,
      renewalAttempts: sub.renewalAttempts,
      lastRenewalAttemptAt: sub.lastRenewalAttemptAt,
    },
    data: {
      // Same slot bookkeeping as create-invoice; paymentStatus "created" makes
      // decideRenewalAction treat the charge as in flight on later runs.
      pendingPlanId: plan,
      activatedInvoiceId: null,
      paymentStatus: "created",
      renewalAttempts: { increment: 1 },
      lastRenewalAttemptAt: now,
    },
  });
  return count === 1;
}

export type DowngradeSnapshot = {
  id: string;
  planId: string;
  expiresAt: Date | null;
};

/**
 * Moves an ended subscription back to free, at most once. Same reasoning as
 * the reserve above: a doubled cron run holds the same snapshot, and an
 * unconditional update let both runs "downgrade" and both send the
 * subscription-ended email. Conditional on the plan and expiry still being
 * what this run read, so it also stops if a payment extended the plan in the
 * meantime. The cron sends the email only when this returns true.
 */
export async function downgradeToFreeOnce(sub: DowngradeSnapshot): Promise<boolean> {
  const { count } = await prisma.subscription.updateMany({
    where: {
      id: sub.id,
      planId: sub.planId as "MONTHLY" | "YEARLY",
      expiresAt: sub.expiresAt,
    },
    data: {
      planId: "FREE",
      nextChargeAt: null,
      renewalAttempts: 0,
      paymentStatus: null,
      canceledAt: null,
    },
  });
  return count === 1;
}
