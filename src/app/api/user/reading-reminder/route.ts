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
    select: { readingReminder: true },
  });

  return NextResponse.json({ readingReminder: user?.readingReminder ?? false });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { readingReminder } = await request.json();

  if (typeof readingReminder !== "boolean") {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  // Paid feature — enforced here, not just hidden in the UI. Switching it OFF is
  // always allowed: a lapsed subscriber must be able to stop the mail.
  if (readingReminder) {
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
    // Clearing the stamp on opt-in means someone who switches it back on isn't
    // held to the previous run's weekly floor.
    data: { readingReminder, ...(readingReminder ? { reminderSentOn: null } : {}) },
  });

  return NextResponse.json({ readingReminder });
}
