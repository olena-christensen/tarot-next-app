import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PlanId } from "@/lib/plans";
import { isActiveTier } from "@/lib/readingAccess";

const DEFAULT_TAKE = 20;
const MAX_TAKE = 50;

/**
 * Reading history — subscriber-only (the MONTHLY/YEARLY plans advertise it).
 * Newest first, cursor-paginated on the row id.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { planId: true, expiresAt: true },
    });
    // Absence of a Subscription row = FREE (the app-wide convention).
    const planId = (sub?.planId as PlanId | undefined) ?? "FREE";
    if (!isActiveTier(planId, sub?.expiresAt ?? null, new Date())) {
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const requested = Number(searchParams.get("take"));
    const take =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.floor(requested), MAX_TAKE)
        : DEFAULT_TAKE;

    // Fetch one extra row to learn whether another page exists without a count query.
    const rows = await prisma.reading.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        cards: true,
        response: true,
        title: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;

    return NextResponse.json({
      readings: page.map((r) => ({
        id: r.id,
        cards: r.cards,
        response: r.response,
        title: r.title,
        createdAt: r.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (err) {
    console.error("[readings] list failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Purge the caller's entire history. Deliberately NOT subscriber-gated:
 * someone who lapses to FREE must still be able to erase what was recorded.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { count } = await prisma.reading.deleteMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ deleted: count });
  } catch (err) {
    console.error("[readings] purge failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
