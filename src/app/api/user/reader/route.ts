import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { READER_IDS, DEFAULT_READER } from "@/lib/readers";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredReader: true },
  });

  return NextResponse.json({ reader: user?.preferredReader ?? "vespera" });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reader } = await request.json();

  if (typeof reader !== "string" || !READER_IDS.includes(reader as any)) {
    return NextResponse.json(
      { error: "Invalid reader" },
      { status: 400 }
    );
  }

  // "Choose your diviner" is a paid feature (see plans.json). The modal hides
  // locked readers, but that is cosmetic — enforce it here too, or anyone can
  // PATCH their way to a premium reader. The default reader stays free.
  if (reader !== DEFAULT_READER) {
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
    data: { preferredReader: reader },
  });

  return NextResponse.json({ reader });
}
