import type { PlanId } from "./plans";
import { prisma } from "./prisma";

export async function getUserPlan(userId: string): Promise<PlanId> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { planId: true },
    });
    return (sub?.planId as PlanId | undefined) ?? "FREE";
  } catch (err) {
    console.error("[getUserPlan] failed, defaulting to FREE", err);
    return "FREE";
  }
}

export type SubscriptionStatus = {
  planId: PlanId;
  readingCredits: number;
  /** Last Mono status string ("created" | "processing" | "success" | "failure" | "reversed" | null). */
  paymentStatus: string | null;
  /** The purchase in flight, if any ("SINGLE" | "MONTHLY" | "YEARLY"); cleared once settled. */
  pendingPlanId: string | null;
  /** ISO date the current paid period ends, or null. */
  expiresAt: string | null;
  /** Whether the subscription auto-renews (false = canceled at period end). */
  autoRenew: boolean;
};

/**
 * Single-query snapshot used by the post-payment result page to decide whether a
 * purchase has settled. paymentStatus/pendingPlanId are the authoritative
 * "is it done yet" signal (set server-side by the webhook); planId + readingCredits
 * describe the resulting entitlement.
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        planId: true,
        readingCredits: true,
        paymentStatus: true,
        pendingPlanId: true,
        expiresAt: true,
        autoRenew: true,
      },
    });
    return {
      planId: (sub?.planId as PlanId | undefined) ?? "FREE",
      readingCredits: sub?.readingCredits ?? 0,
      paymentStatus: sub?.paymentStatus ?? null,
      pendingPlanId: sub?.pendingPlanId ?? null,
      expiresAt: sub?.expiresAt ? sub.expiresAt.toISOString() : null,
      autoRenew: sub?.autoRenew ?? true,
    };
  } catch (err) {
    console.error("[getSubscriptionStatus] failed, defaulting to FREE", err);
    return {
      planId: "FREE",
      readingCredits: 0,
      paymentStatus: null,
      pendingPlanId: null,
      expiresAt: null,
      autoRenew: true,
    };
  }
}

/**
 * Returns the user's consumable one-off reading credits (SINGLE purchases).
 * Kept separate from getUserPlan: credits are not a recurring tier.
 */
export async function getReadingCredits(userId: string): Promise<number> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { readingCredits: true },
    });
    return sub?.readingCredits ?? 0;
  } catch (err) {
    console.error("[getReadingCredits] failed, defaulting to 0", err);
    return 0;
  }
}
