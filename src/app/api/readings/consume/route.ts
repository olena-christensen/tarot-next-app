import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PlanId } from "@/lib/plans";
import { decideReadingAccess, utcMidnight } from "@/lib/readingAccess";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { cards, response } = (body ?? {}) as {
    cards?: unknown;
    response?: unknown;
  };
  if (
    !Array.isArray(cards) ||
    cards.length === 0 ||
    !cards.every((c) => typeof c === "string") ||
    typeof response !== "string" ||
    response.length === 0
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const now = new Date();

  try {
    // Resolve entitlement and commit the reading atomically. The whole
    // count → decide → write (and credit decrement) runs in one interactive
    // transaction so a thrown write rolls back any credit spend — a paid
    // credit can never be debited without a reading row landing.
    const result = await prisma.$transaction(async (tx) => {
      // Serialize THIS user's concurrent draws. A transaction-scoped advisory
      // lock auto-releases on commit/rollback (correct under Neon's
      // transaction-mode pooler, unlike a session-level lock) and needs no
      // table row to exist. With it held, the count → create window below is
      // race-free, so no two simultaneous draws can both pass the daily limit.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

      const sub = await tx.subscription.findUnique({
        where: { userId },
        select: { planId: true, expiresAt: true, readingCredits: true },
      });
      // Absence of a Subscription row = FREE (the app-wide convention).
      const planId = (sub?.planId as PlanId | undefined) ?? "FREE";
      const readingCredits = sub?.readingCredits ?? 0;
      const expiresAt = sub?.expiresAt ?? null;

      const readingsToday = await tx.reading.count({
        where: { userId, createdAt: { gte: utcMidnight(now) } },
      });

      const decision = decideReadingAccess(
        { planId, expiresAt, readingsToday, readingCredits },
        now
      );

      if (decision.mode === "blocked") {
        return { allowed: false as const, reason: "limit_reached" as const };
      }

      // Holding the advisory lock, no concurrent draw can interleave, so a
      // plain decrement is safe; it rolls back with the reading write below.
      if (decision.mode === "credit") {
        await tx.subscription.update({
          where: { userId },
          data: { readingCredits: { decrement: 1 } },
        });
      }

      await tx.reading.create({
        data: { userId, cards: cards as string[], response: response as string },
      });

      if (decision.mode === "subscription") {
        return { allowed: true as const, mode: "subscription" as const };
      }
      if (decision.mode === "free") {
        return {
          allowed: true as const,
          mode: "free" as const,
          remaining: decision.remaining,
        };
      }
      return {
        allowed: true as const,
        mode: "credit" as const,
        creditsLeft: Math.max(0, readingCredits - 1),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    // A DB failure leaves nothing committed (the transaction rolled back). The
    // client treats a non-200 as fail-open and still shows the reading, so we
    // never block a legitimate reader on a transient error — we just don't
    // record it. (Spec: Error handling.)
    console.error("[readings/consume] transaction failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
