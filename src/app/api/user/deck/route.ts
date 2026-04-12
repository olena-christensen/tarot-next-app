import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DECK_IDS } from "@/lib/decks";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredDeck: true },
  });

  return NextResponse.json({ deck: user?.preferredDeck ?? "Rider-Waite" });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deck } = await request.json();

  if (typeof deck !== "string" || !DECK_IDS.includes(deck as any)) {
    return NextResponse.json(
      { error: "Invalid deck" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredDeck: deck },
  });

  return NextResponse.json({ deck });
}
