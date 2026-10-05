import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for the three tables the reward touches.
type Row = {
  id: string;
  userId: string | null;
  anonId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  day: string | null;
  outcome?: string | null;
  takenById?: string | null;
  takenDay?: string | null;
  takenAt?: Date | null;
};
const db = vi.hoisted(() => ({
  rounds: [] as Row[],
  rewards: new Set<string>(),
  credits: new Map<string, number>(),
  seq: 0,
  missLookup: false,
}));

vi.mock("@/lib/prisma", async () => {
  const { Prisma } = await import("@/generated/prisma");
  const match = (r: Row, w: Record<string, unknown>): boolean =>
    Object.entries(w).every(([k, v]) => {
      if (k === "OR") return (v as Record<string, unknown>[]).some((o) => match(r, o));
      const val = r[k as keyof Row] ?? null;
      if (v && typeof v === "object" && "not" in v) return val !== (v as { not: unknown }).not;
      if (v && typeof v === "object" && "lt" in v) return (val as Date) < (v as { lt: Date }).lt;
      return val === v;
    });
  const prisma = {
    potionRound: {
      deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
        db.rounds = db.rounds.filter((r) => !match(r, where));
      },
      create: async ({ data }: { data: Partial<Row> }) => {
        const row = { id: `r${++db.seq}`, finishedAt: null, day: null, outcome: null, takenById: null, ...data } as Row;
        db.rounds.push(row);
        return row;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        db.rounds.find((r) => r.id === where.id) ?? null,
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
        const hit = db.rounds.filter((r) => match(r, where));
        hit.forEach((r) => Object.assign(r, data));
        return { count: hit.length };
      },
      count: async ({ where }: { where: Record<string, unknown> }) =>
        db.rounds.filter((r) => match(r, where)).length,
    },
    potionReward: {
      findUnique: async ({ where }: { where: { userId_day: { userId: string; day: string } } }) =>
        !db.missLookup && db.rewards.has(`${where.userId_day.userId}|${where.userId_day.day}`) ? {} : null,
      create: ({ data }: { data: { userId: string; day: string } }) => async () => {
        const key = `${data.userId}|${data.day}`;
        if (db.rewards.has(key)) {
          throw new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "x" });
        }
        db.rewards.add(key);
      },
    },
    subscription: {
      upsert: ({ where }: { where: { userId: string } }) => async () => {
        db.credits.set(where.userId, (db.credits.get(where.userId) ?? 0) + 1);
      },
    },
    $transaction: async (ops: Array<() => Promise<void>>) => {
      for (const op of ops) await op();
    },
  };
  return { prisma };
});

import {
  GIFT_TTL_MS,
  MIN_ROUND_MS,
  decideRound,
  finishRound,
  gameDay,
  getProgress,
  giftStatus,
  startRound,
  takeGift,
} from "./reward";

const T0 = new Date("2026-10-07T10:00:00Z");
const later = (ms: number) => new Date(T0.getTime() + ms);

type O = { userId: string | null; anonId: string | null };

/** Brew one potion; returns its round id. */
async function brew(owner: O, i = 0) {
  const id = await startRound(owner, T0);
  const res = await finishRound(id, owner, later(MIN_ROUND_MS + i));
  expect(res.ok).toBe(true);
  return id;
}

/** Brew and keep n potions; returns the last progress. */
async function play(owner: O, n: number) {
  let last;
  for (let i = 0; i < n; i++) {
    const id = await brew(owner, i);
    last = await decideRound(id, "kept", owner, later(MIN_ROUND_MS + i));
  }
  return last;
}

describe("potion moonstones", () => {
  beforeEach(() => {
    db.rounds = [];
    db.rewards.clear();
    db.credits.clear();
    db.missLookup = false;
  });

  it("days turn over at midnight Kyiv time", () => {
    expect(gameDay(new Date("2026-10-07T20:59:00Z"))).toBe("2026-10-07"); // 23:59 Kyiv
    expect(gameDay(new Date("2026-10-07T21:00:00Z"))).toBe("2026-10-08"); // 00:00 Kyiv
  });

  it("three potions give exactly one moonstone a day", async () => {
    const me = { userId: "u1", anonId: null };
    expect(await play(me, 2)).toMatchObject({ today: 2, rewarded: false });
    expect(await play(me, 1)).toMatchObject({ today: 3, justRewarded: true });
    expect(await play(me, 1)).toMatchObject({ today: 4, rewarded: true, justRewarded: false });
    expect(db.credits.get("u1")).toBe(1);
  });

  it("a round finished too fast does not count", async () => {
    const me = { userId: "u1", anonId: null };
    const id = await startRound(me, T0);
    expect(await finishRound(id, me, later(MIN_ROUND_MS - 1))).toEqual({ ok: false, reason: "too-fast" });
    expect((await getProgress(me, later(MIN_ROUND_MS))).today).toBe(0);
  });

  it("a round can be finished once, and only by its player", async () => {
    const me = { userId: "u1", anonId: null };
    const id = await startRound(me, T0);
    expect(await finishRound(id, { userId: "u2", anonId: null }, later(MIN_ROUND_MS))).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect((await finishRound(id, me, later(MIN_ROUND_MS))).ok).toBe(true);
    expect(await finishRound(id, me, later(MIN_ROUND_MS))).toEqual({ ok: false, reason: "not-found" });
  });

  it("a visitor's potions are claimed on sign-in", async () => {
    const visitor = { userId: null, anonId: "a1" };
    expect(await play(visitor, 3)).toMatchObject({ signedIn: false, today: 3, rewarded: false });
    expect(db.credits.size).toBe(0);

    const signedIn = await getProgress({ userId: "u1", anonId: "a1" }, later(MIN_ROUND_MS + 5));
    expect(signedIn).toMatchObject({ signedIn: true, today: 3, justRewarded: true });
    expect(db.credits.get("u1")).toBe(1);
  });

  it("a second reward the same day is refused by the key", async () => {
    const me = { userId: "u1", anonId: null };
    await play(me, 3);
    db.missLookup = true; // the lookup misses a reward another request just wrote
    const p = await getProgress(me, later(MIN_ROUND_MS + 5));
    expect(p).toMatchObject({ rewarded: true, justRewarded: false });
    expect(db.credits.get("u1")).toBe(1);
  });

  it("a finished potion counts only once it is kept", async () => {
    const me = { userId: "u1", anonId: null };
    await brew(me);
    expect((await getProgress(me, later(MIN_ROUND_MS))).today).toBe(0);
  });

  it("starting another round keeps the undecided potion", async () => {
    const me = { userId: "u1", anonId: null };
    await brew(me);
    await startRound(me, later(MIN_ROUND_MS + 1));
    expect((await getProgress(me, later(MIN_ROUND_MS + 2))).today).toBe(1);
  });

  it("a sent potion counts for the friend who takes it, not for the brewer", async () => {
    const me = { userId: "u1", anonId: null };
    const friend = { userId: "u2", anonId: null };
    await play(me, 2);
    const id = await brew(me, 5);
    expect(await decideRound(id, "sent", me, later(MIN_ROUND_MS + 5))).toMatchObject({ today: 2 });
    expect(await giftStatus(id, later(MIN_ROUND_MS + 6))).toBe("available");

    const took = await takeGift(id, friend, later(MIN_ROUND_MS + 6));
    expect(took).toMatchObject({ ok: true, progress: { today: 1 } });
    expect(await giftStatus(id, later(MIN_ROUND_MS + 7))).toBe("taken");
    expect(await takeGift(id, { userId: "u3", anonId: null }, later(MIN_ROUND_MS + 7))).toEqual({
      ok: false,
      reason: "taken",
    });
    // Opening the link again just shows their progress.
    expect((await takeGift(id, friend, later(MIN_ROUND_MS + 8))).ok).toBe(true);
    expect((await getProgress(me, later(MIN_ROUND_MS + 8))).today).toBe(2);
  });

  it("a taken gift can complete the friend's moonstone", async () => {
    const me = { userId: "u1", anonId: null };
    const friend = { userId: "u2", anonId: null };
    await play(friend, 2);
    const id = await brew(me, 5);
    await decideRound(id, "sent", me, later(MIN_ROUND_MS + 5));
    expect(await takeGift(id, friend, later(MIN_ROUND_MS + 6))).toMatchObject({
      ok: true,
      progress: { today: 3, justRewarded: true },
    });
    expect(db.credits.get("u2")).toBe(1);
  });

  it("nobody takes their own potion, a kept one, or one older than 7 days", async () => {
    const me = { userId: "u1", anonId: null };
    const friend = { userId: "u2", anonId: null };
    const own = await brew(me);
    await decideRound(own, "sent", me, later(MIN_ROUND_MS));
    expect(await takeGift(own, me, later(MIN_ROUND_MS + 1))).toEqual({ ok: false, reason: "own" });

    const kept = await brew(me, 1);
    await decideRound(kept, "kept", me, later(MIN_ROUND_MS + 1));
    expect(await takeGift(kept, friend, later(MIN_ROUND_MS + 2))).toEqual({ ok: false, reason: "taken" });

    const old = await brew(me, 2);
    await decideRound(old, "sent", me, later(MIN_ROUND_MS + 2));
    expect(await takeGift(old, friend, later(MIN_ROUND_MS + 3 + GIFT_TTL_MS))).toEqual({
      ok: false,
      reason: "gone",
    });
  });

  it("a shared link still works if the 'sent' tap hasn't reached the server yet", async () => {
    const visitor = { userId: null, anonId: "a1" };
    const id = await brew(visitor);
    expect(await takeGift(id, { userId: "u2", anonId: null }, later(MIN_ROUND_MS + 1))).toMatchObject({ ok: true });
    // The brewer can no longer keep it.
    await decideRound(id, "kept", visitor, later(MIN_ROUND_MS + 2));
    expect((await getProgress(visitor, later(MIN_ROUND_MS + 2))).today).toBe(0);
  });
});
