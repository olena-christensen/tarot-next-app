import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dailyCardEmail: true },
  });

  return NextResponse.json({ dailyCardEmail: user?.dailyCardEmail ?? false });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dailyCardEmail } = await request.json();

  if (typeof dailyCardEmail !== "boolean") {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  // Paid feature — enforced here, not just hidden in the UI. Switching it OFF is
  // always allowed: a lapsed subscriber must be able to stop the mail.
  if (dailyCardEmail) {
    const { isSubscriber } = await getSubscriptionStatus(session.user.id);
    if (!isSubscriber) {
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 }
      );
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { dailyCardEmail },
  });

  return NextResponse.json({ dailyCardEmail });
}
