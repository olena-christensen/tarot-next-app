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
