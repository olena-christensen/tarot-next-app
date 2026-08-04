import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActiveTier } from "@/lib/readingAccess";
import { decideReminder } from "@/lib/readingReminder";
import { getReminderStrings } from "@/lib/reminderEmail";
import { sendReadingReminderEmail } from "@/lib/mailer";
import { alertOnJobFailures } from "@/lib/alert";
import { utcDayKey } from "@/lib/dailyCard";
import type { PlanId } from "@/lib/plans";

// Nudges opted-in subscribers who haven't drawn in a while. Runs daily; the
// once-a-week floor is enforced per user by decideReminder, not by the schedule.
//
// Bearer-auth via CRON_SECRET, same as the other cron routes.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/** Rows fetched per round. */
const BATCH_SIZE = 100;

/** Stop starting new work after this long; `maxDuration` is 300s. */
const DEADLINE_MS = 240_000;

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

  const startedAt = Date.now();
  const now = new Date();
  const day = utcDayKey(now);

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let remaining = false;

  /**
   * Everyone looked at this run who did NOT get stamped — not idle enough, in
   * cooldown, lapsed, or a failed send. They still match the query, so without
   * this the loop would re-fetch the same rows forever and never reach anyone
   * behind them. For this job that is most of the list, since the common case
   * is "active reader, no nudge needed".
   */
  const settled = new Set<string>();

  // Rounds, not pages: `reminderSentOn` is the bookmark for anyone actually
  // mailed, and `settled` covers the rest for the length of this invocation.
  while (true) {
    if (Date.now() - startedAt > DEADLINE_MS) {
      remaining = true;
      break;
    }

    const users = await prisma.user.findMany({
      where: {
        readingReminder: true,
        email: { not: null },
        subscription: { planId: { in: ["MONTHLY", "YEARLY"] } },
        NOT: { reminderSentOn: day },
        ...(settled.size ? { id: { notIn: Array.from(settled) } } : {}),
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
      take: BATCH_SIZE,
    });

    if (users.length === 0) break;

    for (const user of users) {
      // Re-checked at send time: a subscription that lapsed since the toggle was
      // flipped must stop producing mail without anyone clearing the flag.
      const active = isActiveTier(
        (user.subscription?.planId as PlanId | undefined) ?? "FREE",
        user.subscription?.expiresAt ?? null,
        now
      );
      if (!active || !user.email) {
        skipped++;
        settled.add(user.id);
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
        settled.add(user.id);
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
          settled.add(user.id);
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
        settled.add(user.id);
      }
    }
  }

  const result = { day, sent, skipped, failed, remaining };
  console.log("[cron/reading-reminder] done", result);
  await alertOnJobFailures("reading-reminder", result);

  return NextResponse.json(result);
}
