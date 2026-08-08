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
import { alertOnJobFailures } from "@/lib/alert";
import { recordHeartbeat } from "@/lib/heartbeat";
import { runCronJob } from "@/lib/cronJob";
import { withDbWake } from "@/lib/dbWake";
import { DEFAULT_DECK } from "@/lib/decks";
import type { PlanId } from "@/lib/plans";

// The daily card email. Sends one card per opted-in subscriber, in their locale,
// with their deck's art.
//
// Scheduled in vercel.json at "0 2 * * *" — 04:00 Kyiv (GMT+2); crons run in UTC.
// See docs/features/daily-card-email.md.
//
// Bearer-auth via CRON_SECRET, same as the other two cron routes.

export const dynamic = "force-dynamic";
// nodemailer needs Node.
export const runtime = "nodejs";
// Sending is serialized over SMTP; give the batch room inside the platform max.
export const maxDuration = 300;

/** Rows fetched per round. Small enough that a slow batch doesn't strand work. */
const BATCH_SIZE = 100;

/**
 * Stop starting new work after this long and report `remaining: true`.
 * `maxDuration` is 300s; the headroom covers the send already in flight.
 */
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

  // Wrapped so a throw still reaches the inbox: everything below reports at the
  // END of the run, which is no help when the run dies at the first query.
  return runCronJob("daily-card", sendDailyCards);
}

async function sendDailyCards() {
  const startedAt = Date.now();
  const now = new Date();
  const day = utcDayKey(now);

  let sent = 0;
  let skipped = 0;
  let duplicate = 0;
  let failed = 0;
  let remaining = false;

  /**
   * Anyone looked at this run who did NOT get stamped — skipped or failed.
   * Without this they match the query again on the next round and the loop
   * never advances past them.
   */
  const settled = new Set<string>();

  // Rounds, not pages. `dailyCardSentOn` IS the bookmark: excluding today's
  // stamp in the QUERY (rather than fetching everyone and skipping them after)
  // means each round naturally returns the next people who still need mail. No
  // cursor to carry, and a rerun resumes exactly where the last one stopped.
  while (true) {
    if (Date.now() - startedAt > DEADLINE_MS) {
      remaining = true;
      break;
    }

    // Wrapped because at 02:00 the compute has usually been asleep for hours and
    // this is the call that wakes it. See lib/dbWake.ts.
    const users = await withDbWake("daily-card", () =>
      prisma.user.findMany({
      where: {
        dailyCardEmail: true,
        email: { not: null },
        // Cheap pre-filter; the authoritative entitlement check is isActiveTier
        // below, which also enforces the expiry date.
        subscription: { planId: { in: ["MONTHLY", "YEARLY"] } },
        NOT: { dailyCardSentOn: day },
        ...(settled.size ? { id: { notIn: Array.from(settled) } } : {}),
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
      take: BATCH_SIZE,
      })
    );

    if (users.length === 0) break;

    for (const user of users) {
      // Belt and braces: the query already excludes today's stamp, so this only
      // fires if a concurrent run stamped them between the fetch and here.
      if (user.dailyCardSentOn === day) {
        duplicate++;
        settled.add(user.id);
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
        settled.add(user.id);
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
          settled.add(user.id);
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
          settled.add(user.id);
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
        settled.add(user.id);
      }
    }
  }

  // `sent` is SMTP-accepted, not merely attempted — a total mail outage now
  // reports failed:N, where it used to report a clean sent:N. `remaining` says
  // the deadline cut the run short, not that anyone was silently dropped.
  const result = { day, sent, skipped, duplicate, failed, remaining };
  console.log("[cron/daily-card] done", result);
  await alertOnJobFailures("daily-card", result);
  // Proof of life. Stamped at the END, so a run that crashes halfway does not
  // claim to have finished.
  await recordHeartbeat("daily-card", result);

  return result;
}
