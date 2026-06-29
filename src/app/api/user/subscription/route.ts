import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggle auto-renew. Cancellation is "at period end": autoRenew=false keeps
// access until expiresAt; the daily cron downgrades to FREE once the period
// ends. Re-enabling clears canceledAt and resumes normal renewal.
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let autoRenew: unknown;
  try {
    ({ autoRenew } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof autoRenew !== "boolean") {
    return NextResponse.json({ error: "Invalid autoRenew" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { planId: true },
  });
  if (!sub || (sub.planId !== "MONTHLY" && sub.planId !== "YEARLY")) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    );
  }

  const updated = await prisma.subscription.update({
    where: { userId: session.user.id },
    data: {
      autoRenew,
      canceledAt: autoRenew ? null : new Date(),
    },
    select: { autoRenew: true, canceledAt: true },
  });

  return NextResponse.json({
    autoRenew: updated.autoRenew,
    canceledAt: updated.canceledAt ? updated.canceledAt.toISOString() : null,
  });
}
