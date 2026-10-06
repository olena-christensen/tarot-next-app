/**
 * "Brew the Potion" moonstones and gifts.
 *
 * Three potions in a (Kyiv) day earn one moonstone. Every round is started and
 * finished through the server, which times it, so a potion only exists when a
 * real round was played. One reward per account per day is guaranteed by
 * PotionReward's (userId, day) key, not by a check-then-write.
 *
 * A finished potion is undecided until the player chooses (Lena, 2026-10-07):
 *  - "kept": counts toward the brewer's three;
 *  - "sent": a gift. The shared link carries the round id; a friend who signs in
 *    takes it once, within 7 days, and it counts toward THEIR three that day.
 * Undecided potions are kept automatically when the player starts another round.
 *
 * Visitors who aren't signed in are tracked by a random id in an httpOnly
 * cookie. Their rounds are kept, and the first progress call after they sign in
 * moves them to the account — which is how "Claim your moonstone" works.
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { POTIONS_PER_MOONSTONE, ROUND_TIME_MS } from "./index";

export { POTIONS_PER_MOONSTONE };
/** A round faster than this is not a real round. */
export const MIN_ROUND_MS = 10_000;
/** The sand clock plus room for the last item's flight and a slow network. */
export const MAX_ROUND_MS = ROUND_TIME_MS + 15_000;
/** How long a friend has to take a sent potion. */
export const GIFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ANON_COOKIE = "potion_anon";
const DAY_ZONE = "Europe/Kyiv";
/** Rounds are only needed until their gift link expires. */
const KEEP_ROUNDS_MS = GIFT_TTL_MS + 24 * 60 * 60 * 1000;

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
  /** Potions that count today: kept ones plus gifts taken today. */
  today: number;
  /** Today's moonstone is on the account (signed in only). */
  rewarded: boolean;
  /** It was added by this very call — show "+1 moonstone!". */
  justRewarded: boolean;
};

export type FinishResult =
  | { ok: true; progress: PotionProgress }
  | { ok: false; reason: "not-found" | "too-fast" | "too-slow" };

export type GiftStatus = "available" | "taken" | "gone";

export type TakeResult =
  | { ok: true; progress: PotionProgress }
  | { ok: false; reason: "own" | "taken" | "gone" };

function ownsRound(
  round: { userId: string | null; anonId: string | null },
  owner: Owner,
): boolean {
  return Boolean(
    (owner.userId && round.userId === owner.userId) ||
      (owner.anonId && round.anonId === owner.anonId),
  );
}

/** Undecided potions of this player (finished, no choice made). */
function undecided(owner: Owner): Prisma.PotionRoundWhereInput | null {
  if (owner.userId) return { userId: owner.userId, finishedAt: { not: null }, outcome: null };
  if (owner.anonId) return { anonId: owner.anonId, finishedAt: { not: null }, outcome: null };
  return null;
}

export async function startRound(owner: Owner, now: Date = new Date()): Promise<string> {
  // Drop rounds whose gift link has long expired.
  await prisma.potionRound
    .deleteMany({ where: { startedAt: { lt: new Date(now.getTime() - KEEP_ROUNDS_MS) } } })
    .catch(() => {});
  // Walking away from the end screen without choosing means keeping it.
  const open = undecided(owner);
  if (open) await prisma.potionRound.updateMany({ where: open, data: { outcome: "kept" } });
  const round = await prisma.potionRound.create({
    data: { userId: owner.userId, anonId: owner.userId ? null : owner.anonId, startedAt: now },
    select: { id: true },
  });
  return round.id;
}

/** Finishing makes the potion; it counts only once the player keeps it. */
export async function finishRound(
  roundId: string,
  owner: Owner,
  now: Date = new Date(),
): Promise<FinishResult> {
  const round = await prisma.potionRound.findUnique({ where: { id: roundId } });
  if (!round || !ownsRound(round, owner) || round.finishedAt) return { ok: false, reason: "not-found" };
  if (now.getTime() - round.startedAt.getTime() < MIN_ROUND_MS) {
    return { ok: false, reason: "too-fast" };
  }
  if (now.getTime() - round.startedAt.getTime() > MAX_ROUND_MS) {
    return { ok: false, reason: "too-slow" }; // it boiled over
  }
  // Only a round still unfinished is updated, so a double submit counts once.
  await prisma.potionRound.updateMany({
    where: { id: round.id, finishedAt: null },
    data: { finishedAt: now, day: gameDay(now), userId: owner.userId ?? round.userId },
  });
  return { ok: true, progress: await getProgress(owner, now) };
}

/** The player's choice on the end screen. Only an undecided potion can change. */
export async function decideRound(
  roundId: string,
  outcome: "kept" | "sent",
  owner: Owner,
  now: Date = new Date(),
): Promise<PotionProgress | null> {
  const round = await prisma.potionRound.findUnique({ where: { id: roundId } });
  if (!round || !ownsRound(round, owner) || !round.finishedAt) return null;
  await prisma.potionRound.updateMany({
    where: { id: round.id, outcome: null },
    data: { outcome },
  });
  return getProgress(owner, now);
}

/** What the friend's page should offer for a gift link. */
export async function giftStatus(roundId: string, now: Date = new Date()): Promise<GiftStatus> {
  const round = await prisma.potionRound.findUnique({ where: { id: roundId } });
  if (!round?.finishedAt || now.getTime() - round.finishedAt.getTime() > GIFT_TTL_MS) return "gone";
  if (round.takenById || round.outcome === "kept") return "taken";
  return "available";
}

/**
 * A signed-in friend takes a sent potion. A link that was shared but not yet
 * marked as sent (the sender's tap is still on its way) counts as sent: the
 * link only leaves the brewer's device by sharing it.
 */
export async function takeGift(
  roundId: string,
  owner: Owner & { userId: string },
  now: Date = new Date(),
): Promise<TakeResult> {
  const round = await prisma.potionRound.findUnique({ where: { id: roundId } });
  if (!round?.finishedAt || now.getTime() - round.finishedAt.getTime() > GIFT_TTL_MS) {
    return { ok: false, reason: "gone" };
  }
  if (ownsRound(round, owner)) return { ok: false, reason: "own" };
  if (round.takenById === owner.userId) return { ok: true, progress: await getProgress(owner, now) };
  if (round.takenById || round.outcome === "kept") return { ok: false, reason: "taken" };

  const { count } = await prisma.potionRound.updateMany({
    where: { id: round.id, takenById: null, OR: [{ outcome: null }, { outcome: "sent" }] },
    data: { outcome: "sent", takenById: owner.userId, takenDay: gameDay(now), takenAt: now },
  });
  if (count === 0) return { ok: false, reason: "taken" };
  return { ok: true, progress: await getProgress(owner, now) };
}

/**
 * Today's progress. For a signed-in player this also takes over the rounds they
 * played before signing in and adds the day's moonstone once three count.
 */
export async function getProgress(owner: Owner, now: Date = new Date()): Promise<PotionProgress> {
  const day = gameDay(now);

  if (owner.userId && owner.anonId) {
    await prisma.potionRound.updateMany({
      where: { anonId: owner.anonId, userId: null },
      data: { userId: owner.userId },
    });
  }

  let today = 0;
  if (owner.userId) {
    const [kept, taken] = await Promise.all([
      prisma.potionRound.count({ where: { userId: owner.userId, day, outcome: "kept" } }),
      prisma.potionRound.count({ where: { takenById: owner.userId, takenDay: day } }),
    ]);
    today = kept + taken;
  } else if (owner.anonId) {
    today = await prisma.potionRound.count({
      where: { anonId: owner.anonId, userId: null, day, outcome: "kept" },
    });
  }

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
