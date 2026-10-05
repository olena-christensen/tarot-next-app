/**
 * "Brew the Potion" moonstones: three potions in a day earn one moonstone.
 *
 * Every round is started and finished through the server, which times it, so
 * a potion only counts when a real round was played. One reward per account per
 * day is guaranteed by PotionReward's (userId, day) key, not by a check-then-write.
 *
 * Visitors who aren't signed in are tracked by a random id in an httpOnly
 * cookie. Their rounds are kept, and the first progress call after they sign in
 * moves today's rounds to the account — which is how "Claim your moonstone" works.
 *
 * Days are Kyiv calendar days, so the counter resets at midnight Kyiv time.
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { POTIONS_PER_MOONSTONE } from "./index";

export { POTIONS_PER_MOONSTONE };
/** A round faster than this is not a real round. */
export const MIN_ROUND_MS = 10_000;
export const ANON_COOKIE = "potion_anon";
const DAY_ZONE = "Europe/Kyiv";
const KEEP_ROUNDS_MS = 2 * 24 * 60 * 60 * 1000;

/** Kyiv calendar day as YYYY-MM-DD. */
export function gameDay(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAY_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export type Owner = { userId: string | null; anonId: string | null };

export type PotionProgress = {
  signedIn: boolean;
  /** Potions finished today. */
  today: number;
  /** Today's moonstone is on the account (signed in only). */
  rewarded: boolean;
  /** It was added by this very call — show "+1 moonstone!". */
  justRewarded: boolean;
};

export type FinishResult =
  | { ok: true; progress: PotionProgress }
  | { ok: false; reason: "not-found" | "too-fast" };

/** Owner filter for the rounds of today. */
function todaysRounds(owner: Owner, day: string): Prisma.PotionRoundWhereInput | null {
  if (owner.userId) return { userId: owner.userId, day };
  if (owner.anonId) return { anonId: owner.anonId, userId: null, day };
  return null;
}

export async function startRound(owner: Owner, now: Date = new Date()): Promise<string> {
  // Rounds only matter on the day they finish; drop anything older.
  await prisma.potionRound
    .deleteMany({ where: { startedAt: { lt: new Date(now.getTime() - KEEP_ROUNDS_MS) } } })
    .catch(() => {});
  const round = await prisma.potionRound.create({
    data: { userId: owner.userId, anonId: owner.userId ? null : owner.anonId, startedAt: now },
    select: { id: true },
  });
  return round.id;
}

export async function finishRound(
  roundId: string,
  owner: Owner,
  now: Date = new Date(),
): Promise<FinishResult> {
  const round = await prisma.potionRound.findUnique({ where: { id: roundId } });
  const mine =
    round &&
    ((owner.userId && round.userId === owner.userId) ||
      (owner.anonId && round.anonId === owner.anonId));
  if (!round || !mine || round.finishedAt) return { ok: false, reason: "not-found" };
  if (now.getTime() - round.startedAt.getTime() < MIN_ROUND_MS) {
    return { ok: false, reason: "too-fast" };
  }
  // Only a round still unfinished is updated, so a double submit counts once.
  await prisma.potionRound.updateMany({
    where: { id: round.id, finishedAt: null },
    data: { finishedAt: now, day: gameDay(now), userId: owner.userId ?? round.userId },
  });
  return { ok: true, progress: await getProgress(owner, now) };
}

/**
 * Today's progress. For a signed-in player this also takes over the rounds they
 * played before signing in and adds the day's moonstone once three are done.
 */
export async function getProgress(owner: Owner, now: Date = new Date()): Promise<PotionProgress> {
  const day = gameDay(now);

  if (owner.userId && owner.anonId) {
    await prisma.potionRound.updateMany({
      where: { anonId: owner.anonId, userId: null },
      data: { userId: owner.userId },
    });
  }

  const where = todaysRounds(owner, day);
  const today = where
    ? await prisma.potionRound.count({ where: { ...where, finishedAt: { not: null } } })
    : 0;

  if (!owner.userId) return { signedIn: false, today, rewarded: false, justRewarded: false };

  const existing = await prisma.potionReward.findUnique({
    where: { userId_day: { userId: owner.userId, day } },
  });
  if (existing) return { signedIn: true, today, rewarded: true, justRewarded: false };
  if (today < POTIONS_PER_MOONSTONE) {
    return { signedIn: true, today, rewarded: false, justRewarded: false };
  }

  const userId = owner.userId;
  try {
    await prisma.$transaction([
      prisma.potionReward.create({ data: { userId, day } }),
      prisma.subscription.upsert({
        where: { userId },
        create: { userId, readingCredits: 1 },
        update: { readingCredits: { increment: 1 } },
      }),
    ]);
    return { signedIn: true, today, rewarded: true, justRewarded: true };
  } catch (err) {
    // Another request added it a moment earlier: the key refused a second one.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { signedIn: true, today, rewarded: true, justRewarded: false };
    }
    throw err;
  }
}
