import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActiveTier } from "@/lib/readingAccess";
import { pickDailyCard, utcDayKey } from "@/lib/dailyCard";
import {
  getCardNames,
  getDailyStrings,
  getReaderName,
} from "@/lib/dailyCardStrings";
import { sendDailyCardEmail } from "@/lib/mailer";
import { DEFAULT_DECK } from "@/lib/decks";
import type { PlanId } from "@/lib/plans";

// The daily card email. Sends one card per opted-in subscriber, in their locale,
// with their deck's art.
//
// NOT YET REGISTERED IN vercel.json: Hobby allows two cron jobs and both slots
// are taken (renew, reconcile). Add this at the Pro upgrade —
//   { "path": "/api/cron/daily-card", "schedule": "0 2 * * *" }
// which is 04:00 Kyiv (GMT+2). See docs/features/daily-card-email.md.
//
// Bearer-auth via CRON_SECRET, same as the other two cron routes.

export const dynamic = "force-dynamic";
// nodemailer needs Node.
export const runtime = "nodejs";
// Sending is serialized over SMTP; give the batch room inside the platform max.
export const maxDuration = 300;

/**
 * Users per invocation. A serialized SMTP loop runs at roughly a second per
 * message, so this sits comfortably inside maxDuration with room for slow sends.
 * Past one page the job reports `nextCursor` instead of silently truncating —
 * a cap that isn't reported reads as "everyone got mail" when they didn't.
 */
const PAGE_SIZE = 200;

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app").replace(
    /\/$/,
    ""
  );
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const now = new Date();
  const day = utcDayKey(now);

  const users = await prisma.user.findMany({
    where: {
      dailyCardEmail: true,
      email: { not: null },
      // Cheap pre-filter; the authoritative entitlement check is isActiveTier
      // below, which also enforces the expiry date.
      subscription: { planId: { in: ["MONTHLY", "YEARLY"] } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      preferredLocale: true,
      preferredDeck: true,
      preferredReader: true,
      dailyCardSentOn: true,
      subscription: { select: { planId: true, expiresAt: true } },
    },
    orderBy: { id: "asc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const page = users.slice(0, PAGE_SIZE);
  const nextCursor =
    users.length > PAGE_SIZE ? page[page.length - 1]?.id ?? null : null;

  let sent = 0;
  let skipped = 0;
  let duplicate = 0;
  let failed = 0;

  for (const user of page) {
    // The deterministic pick keeps a rerun on the SAME card; only this stops a
    // second copy of it landing. A double-fire is realistic — a platform retry,
    // or someone hitting the route by hand (which is exactly how the first
    // duplicate happened, 2026-08-03).
    if (user.dailyCardSentOn === day) {
      duplicate++;
      continue;
    }

    // Re-checked at send time, not just at opt-in: a subscription that lapsed
    // since the toggle was flipped must stop producing mail without anyone
    // having to clear the flag.
    const active = isActiveTier(
      (user.subscription?.planId as PlanId | undefined) ?? "FREE",
      user.subscription?.expiresAt ?? null,
      now
    );
    if (!active || !user.email) {
      skipped++;
      continue;
    }

    try {
      const locale = user.preferredLocale || "en";
      const card = pickDailyCard(user.id, day);
      const [strings, cardNames, readerName] = await Promise.all([
        getDailyStrings(locale),
        getCardNames(locale),
        getReaderName(locale, user.preferredReader),
      ]);

      const line = strings.cards[card.id];
      const cardName = cardNames[card.id];
      if (!line || !cardName) {
        // A card with no copy in this locale must not send a broken email.
        console.error("[cron/daily-card] missing copy", {
          card: card.id,
          locale,
        });
        failed++;
        continue;
      }

      const deck = user.preferredDeck || DEFAULT_DECK;
      const accepted = await sendDailyCardEmail({
        to: user.email,
        name: user.name,
        cardName,
        cardImageUrl: `${appOrigin()}/api/card-image?card=${encodeURIComponent(
          card.id
        )}&deck=${encodeURIComponent(deck)}`,
        line,
        readerName,
        appUrl: `${appOrigin()}/${locale}`,
        strings,
      });

      if (!accepted) {
        // SMTP refused it. Leave dailyCardSentOn alone so a later run retries
        // rather than marking an email that never left as delivered.
        failed++;
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { dailyCardSentOn: day },
      });
      sent++;
    } catch (err) {
      // One bad recipient must not end the run for everyone behind them.
      console.error("[cron/daily-card] send failed", { userId: user.id, err });
      failed++;
    }
  }

  // `sent` is SMTP-accepted, not merely attempted — a total mail outage now
  // reports failed:N, where it used to report a clean sent:N.
  const result = { day, sent, skipped, duplicate, failed, nextCursor };
  console.log("[cron/daily-card] done", result);

  return NextResponse.json(result);
}
