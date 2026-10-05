import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for the three tables the reward touches.
type Row = {
  id: string;
  userId: string | null;
  anonId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  day: string | null;
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
  const match = (r: Row, w: Record<string, unknown>) =>
    Object.entries(w).every(([k, v]) => {
      const val = r[k as keyof Row];
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
        const row = { id: `r${++db.seq}`, finishedAt: null, day: null, ...data } as Row;
        db.rounds.push(row);
        return row;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        db.rounds.find((r) => r.id === where.id) ?? null,
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
        db.rounds.filter((r) => match(r, where)).forEach((r) => Object.assign(r, data));
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

import { MIN_ROUND_MS, finishRound, gameDay, getProgress, startRound } from "./reward";

const T0 = new Date("2026-10-07T10:00:00Z");
const later = (ms: number) => new Date(T0.getTime() + ms);

async function play(owner: { userId: string | null; anonId: string | null }, n: number) {
  let last;
  for (let i = 0; i < n; i++) {
    const id = await startRound(owner, T0);
    last = await finishRound(id, owner, later(MIN_ROUND_MS + i));
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
    const second = await play(me, 2);
    expect(second).toMatchObject({ ok: true, progress: { today: 2, rewarded: false } });
    const third = await play(me, 1);
    expect(third).toMatchObject({ ok: true, progress: { today: 3, justRewarded: true } });
    const fourth = await play(me, 1);
    expect(fourth).toMatchObject({ ok: true, progress: { today: 4, rewarded: true, justRewarded: false } });
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
    const third = await play(visitor, 3);
    expect(third).toMatchObject({ ok: true, progress: { signedIn: false, today: 3, rewarded: false } });
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
});
