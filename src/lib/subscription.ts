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
