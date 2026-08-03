import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActiveTier } from "@/lib/readingAccess";
import { decideReminder } from "@/lib/readingReminder";
import { getReminderStrings } from "@/lib/reminderEmail";
import { sendReadingReminderEmail } from "@/lib/mailer";
import { utcDayKey } from "@/lib/dailyCard";
import type { PlanId } from "@/lib/plans";

// Nudges opted-in subscribers who haven't drawn in a while. Runs daily; the
// once-a-week floor is enforced per user by decideReminder, not by the schedule.
//
// Bearer-auth via CRON_SECRET, same as the other cron routes.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

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
      readingReminder: true,
      email: { not: null },
      subscription: { planId: { in: ["MONTHLY", "YEARLY"] } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      preferredLocale: true,
      reminderSentOn: true,
      subscription: { select: { planId: true, expiresAt: true } },
      // Just the newest reading's timestamp — the whole ledger is not needed to
      // answer "when did they last draw".
      readings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
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
  let failed = 0;

  for (const user of page) {
    // Re-checked at send time: a subscription that lapsed since the toggle was
    // flipped must stop producing mail without anyone clearing the flag.
    const active = isActiveTier(
      (user.subscription?.planId as PlanId | undefined) ?? "FREE",
      user.subscription?.expiresAt ?? null,
      now
    );
    if (!active || !user.email) {
      skipped++;
      continue;
    }

    const decision = decideReminder(
      {
        lastReadingAt: user.readings[0]?.createdAt ?? null,
        createdAt: user.createdAt,
        reminderSentOn: user.reminderSentOn,
      },
      now
    );
    if (!decision.send) {
      skipped++;
      continue;
    }

    try {
      const locale = user.preferredLocale || "en";
      const accepted = await sendReadingReminderEmail({
        to: user.email,
        name: user.name,
        appUrl: `${appOrigin()}/${locale}`,
        strings: await getReminderStrings(locale),
      });

      if (!accepted) {
        // Leave reminderSentOn alone so tomorrow's run retries, rather than
        // starting a week-long cooldown on an email that never left.
        failed++;
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { reminderSentOn: day },
      });
      sent++;
    } catch (err) {
      console.error("[cron/reading-reminder] send failed", {
        userId: user.id,
        err,
      });
      failed++;
    }
  }

  const result = { day, sent, skipped, failed, nextCursor };
  console.log("[cron/reading-reminder] done", result);

  return NextResponse.json(result);
}
