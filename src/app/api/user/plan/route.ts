import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Superset of the original { planId } shape: existing callers keep working,
  // the payment result page additionally reads paymentStatus/pendingPlanId/credits.
  const status = await getSubscriptionStatus(session.user.id);
  return NextResponse.json(status);
}
