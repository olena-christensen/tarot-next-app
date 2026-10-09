/**
 * "They Arrive at Midnight" on the server: owned items, buying, placing, the
 * wheel and gifts. Everything needs an account — moonstones live on it.
 *
 * Moonstones are spent with a conditional decrement (`readingCredits >= price`)
 * so two taps can never spend the same moonstone twice. One free and one paid
 * spin a day are guaranteed by CastleSpin's (userId, day, kind) key. One item
 * per place is guaranteed by CastleItem's (userId, place) key.
 *
 * Sending (Lena, 2026-10-07): the item leaves the room at once and waits for the
 * friend for 7 days; if nobody takes it, it comes back to the sender.
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { gameDay } from "@/lib/potionGame/reward";
import {
  COMMON_POOL,
  PAID_SPIN_PRICE,
  RARE_POOL,
  STONES,
  canGo,
  catalogItem,
  pickFrom,
  rollPrize,
  type OwnedItem,
  type PlaceId,
  type PrizeKind,
} from "./catalog";

export const GIFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CastleState = {
  signedIn: boolean;
  balance: number;
  items: OwnedItem[];
  freeSpin: boolean;
  paidSpin: boolean;
};

export type Fail = { ok: false; reason: string };

async function balanceOf(userId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { readingCredits: true } });
  return sub?.readingCredits ?? 0;
}

/** Takes `price` moonstones if the balance has them; false if it doesn't. */
async function spend(tx: Prisma.TransactionClient, userId: string, price: number): Promise<boolean> {
  if (price <= 0) return true;
  const { count } = await tx.subscription.updateMany({
    where: { userId, readingCredits: { gte: price } },
    data: { readingCredits: { decrement: price } },
  });
  return count === 1;
}

async function addStones(tx: Prisma.TransactionClient, userId: string, n: number) {
  await tx.subscription.upsert({
    where: { userId },
    create: { userId, readingCredits: n },
    update: { readingCredits: { increment: n } },
  });
}

export async function getState(userId: string | null, now: Date = new Date()): Promise<CastleState> {
  if (!userId) return { signedIn: false, balance: 0, items: [], freeSpin: false, paidSpin: false };
  // Sent items nobody took within 7 days come home.
  await prisma.castleItem.updateMany({
    where: { userId, sentAt: { lt: new Date(now.getTime() - GIFT_TTL_MS) } },
    data: { sentAt: null },
  });
  const day = gameDay(now);
  const [rows, spins, balance] = await Promise.all([
    prisma.castleItem.findMany({
      where: { userId, sentAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, itemId: true, place: true },
    }),
    prisma.castleSpin.findMany({ where: { userId, day }, select: { kind: true } }),
    balanceOf(userId),
  ]);
  const spun = new Set(spins.map((s: { kind: string }) => s.kind));
  return {
    signedIn: true,
    balance,
    items: rows.map((r: { id: string; itemId: string; place: string | null }) => ({ id: r.id, itemId: r.itemId, place: (r.place as PlaceId | null) ?? null })),
    freeSpin: !spun.has("free"),
    paidSpin: spun.has("free") && !spun.has("paid"),
  };
}

/** Puts an owned item somewhere free, if it can go there. Used by buy and place. */
async function putDown(tx: Prisma.TransactionClient, userId: string, rowId: string, place: PlaceId) {
  const taken = await tx.castleItem.findFirst({ where: { userId, place }, select: { id: true } });
  if (taken && taken.id !== rowId) {
    // Whatever stood there goes back to the player's items.
    await tx.castleItem.update({ where: { id: taken.id }, data: { place: null } });
  }
  await tx.castleItem.update({ where: { id: rowId }, data: { place } });
}

export async function buy(userId: string, itemId: string): Promise<{ ok: true; rowId: string } | Fail> {
  const item = catalogItem(itemId);
  if (!item || item.price === null) return { ok: false, reason: "not-for-sale" };
  try {
    return await prisma.$transaction(async (tx) => {
      if (!(await spend(tx, userId, item.price!))) throw new NotEnough();
      const row = await tx.castleItem.create({ data: { userId, itemId, source: "bought" }, select: { id: true } });
      if (item.autoPlace) await putDown(tx, userId, row.id, item.autoPlace);
      return { ok: true as const, rowId: row.id };
    });
  } catch (err) {
    if (err instanceof NotEnough) return { ok: false, reason: "no-moonstones" };
    throw err;
  }
}

class NotEnough extends Error {}

export async function place(userId: string, rowId: string, where: string): Promise<{ ok: true } | Fail> {
  const row = await prisma.castleItem.findUnique({ where: { id: rowId } });
  if (!row || row.userId !== userId || row.sentAt) return { ok: false, reason: "not-found" };
  if (!canGo(row.itemId, where)) return { ok: false, reason: "wrong-place" };
  await prisma.$transaction((tx) => putDown(tx, userId, rowId, where as PlaceId));
  return { ok: true };
}

export async function takeDown(userId: string, rowId: string): Promise<{ ok: true } | Fail> {
  const { count } = await prisma.castleItem.updateMany({
    where: { id: rowId, userId },
    data: { place: null },
  });
  return count ? { ok: true } : { ok: false, reason: "not-found" };
}

export type SpinResult =
  | { ok: true; pane: number; kind: PrizeKind; stones: number; itemId: string | null; rowId: string | null }
  | Fail;

export async function spin(userId: string, now: Date = new Date()): Promise<SpinResult> {
  const day = gameDay(now);
  const done = new Set(
    (await prisma.castleSpin.findMany({ where: { userId, day }, select: { kind: true } })).map((s: { kind: string }) => s.kind),
  );
  const kind = !done.has("free") ? "free" : !done.has("paid") ? "paid" : null;
  if (!kind) return { ok: false, reason: "no-spins" };

  const prize = rollPrize();
  const stones = STONES[prize.kind] ?? 0;
  const itemId = prize.kind === "item" ? pickFrom(COMMON_POOL) : prize.kind === "rare" ? pickFrom(RARE_POOL) : null;
  try {
    return await prisma.$transaction(async (tx) => {
      // The key refuses a second free (or paid) spin the same day.
      await tx.castleSpin.create({ data: { userId, day, kind, prize: itemId ?? prize.kind } });
      if (kind === "paid" && !(await spend(tx, userId, PAID_SPIN_PRICE))) throw new NotEnough();
      if (stones) await addStones(tx, userId, stones);
      let rowId: string | null = null;
      if (itemId) {
        rowId = (await tx.castleItem.create({ data: { userId, itemId, source: "wheel" }, select: { id: true } })).id;
      }
      return { ok: true as const, pane: prize.pane, kind: prize.kind, stones, itemId, rowId };
    });
  } catch (err) {
    if (err instanceof NotEnough) return { ok: false, reason: "no-moonstones" };
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, reason: "no-spins" };
    }
    throw err;
  }
}

/** The item leaves the room and waits for a friend. Answers the gift id for the link. */
export async function send(userId: string, rowId: string, now: Date = new Date()): Promise<{ ok: true; giftId: string } | Fail> {
  const { count } = await prisma.castleItem.updateMany({
    where: { id: rowId, userId, sentAt: null },
    data: { sentAt: now, place: null },
  });
  if (!count) {
    // Already sent (a second tap): the same link again.
    const row = await prisma.castleItem.findUnique({ where: { id: rowId }, select: { userId: true, sentAt: true } });
    if (row?.userId === userId && row.sentAt) return { ok: true, giftId: rowId };
    return { ok: false, reason: "not-found" };
  }
  return { ok: true, giftId: rowId };
}

export type GiftView = {
  status: "available" | "taken" | "gone";
  itemId: string | null;
  from: string | null;
};

function firstName(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first.slice(0, 40) : null;
}

export async function giftView(giftId: string, now: Date = new Date()): Promise<GiftView> {
  const row = await prisma.castleItem.findUnique({
    where: { id: giftId },
    select: { itemId: true, sentAt: true, takenAt: true, user: { select: { name: true } } },
  });
  if (!row) return { status: "gone", itemId: null, from: null };
  const from = firstName(row.user?.name);
  if (row.takenAt && !row.sentAt) return { status: "taken", itemId: row.itemId, from };
  if (!row.sentAt || now.getTime() - row.sentAt.getTime() > GIFT_TTL_MS) {
    return { status: "gone", itemId: row.itemId, from };
  }
  return { status: "available", itemId: row.itemId, from };
}

export async function takeGift(giftId: string, userId: string, now: Date = new Date()): Promise<{ ok: true; itemId: string } | Fail> {
  const row = await prisma.castleItem.findUnique({ where: { id: giftId } });
  if (!row) return { ok: false, reason: "gone" };
  if (row.userId === userId) return row.sentAt ? { ok: false, reason: "own" } : { ok: true, itemId: row.itemId };
  if (!row.sentAt || now.getTime() - row.sentAt.getTime() > GIFT_TTL_MS) {
    return { ok: false, reason: row.takenAt ? "taken" : "gone" };
  }
  const { count } = await prisma.castleItem.updateMany({
    where: { id: giftId, userId: row.userId, sentAt: { not: null } },
    data: { userId, sentAt: null, place: null, source: "gift", takenAt: now },
  });
  return count ? { ok: true, itemId: row.itemId } : { ok: false, reason: "taken" };
}
