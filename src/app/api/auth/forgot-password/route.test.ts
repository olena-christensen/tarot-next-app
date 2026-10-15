import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, fakeTable, type FakeTable } from "@/lib/testing/fakePrisma";
import type { RateLimitRule, RateLimitState } from "@/lib/rateLimit";

const db = vi.hoisted(() => ({ current: null as unknown as Record<string, unknown> }));
vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db.current;
  },
}));

vi.mock("@/lib/mailer", () => ({ sendPasswordResetEmail: vi.fn(async () => {}) }));

// The real limiter is one SQL statement; here the same policy runs in memory.
const limits = vi.hoisted(() => new Map<string, unknown>());
vi.mock("@/lib/rateLimit", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/rateLimit")>();
  return {
    ...real,
    consumeRateLimit: async (key: string, rule: RateLimitRule) => {
      const d = real.decideRateLimit((limits.get(key) as RateLimitState) ?? null, rule, new Date());
      limits.set(key, d.next);
      return { blocked: d.blocked, retryAfterSeconds: d.retryAfterSeconds };
    },
  };
});

import { POST } from "./route";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { FORGOT_BY_EMAIL, FORGOT_BY_IP } from "@/lib/rateLimit";

const MINUTE = 60_000;

function request(email: string, ip = "1.2.3.4") {
  return new Request("https://theveil.app/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email, locale: "en" }),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
  limits.clear();
  vi.clearAllMocks();
  const users = Array.from({ length: 30 }, (_, i) => ({
    id: `u${i}`,
    email: `user${i}@example.com`,
    password: "hash",
    preferredLocale: "en",
  }));
  const tokens = fakeTable();
  db.current = fakeClient({
    user: fakeTable(users),
    passwordResetToken: {
      ...tokens,
      findFirst: async ({ where }: { where: { userId: string } }) =>
        [...tokens.rows].reverse().find((t) => t.userId === where.userId) ?? null,
      deleteMany: async ({ where }: { where: { userId: string } }) => {
        const before = tokens.rows.length;
        tokens.rows.splice(0, tokens.rows.length, ...tokens.rows.filter((t) => t.userId !== where.userId));
        return { count: before - tokens.rows.length };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { ...data, createdAt: new Date() };
        tokens.rows.push(row);
        return row;
      },
    } as unknown as FakeTable,
  });
});

afterEach(() => vi.useRealTimers());

describe("POST /api/auth/forgot-password", () => {
  it("sends a link for a real account", async () => {
    const res = await POST(request("User0@Example.com"));
    expect(await res.json()).toEqual({ ok: true });
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("one sender can't mail many different inboxes", async () => {
    for (let i = 0; i < FORGOT_BY_IP.limit + 5; i++) {
      const res = await POST(request(`user${i}@example.com`));
      // Refused requests look exactly like accepted ones.
      expect(await res.json()).toEqual({ ok: true });
    }
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(FORGOT_BY_IP.limit);
  });

  it("one inbox can't be flooded from many senders", async () => {
    for (let i = 0; i < FORGOT_BY_EMAIL.limit + 5; i++) {
      vi.advanceTimersByTime(2 * MINUTE); // past the one-a-minute rule
      await POST(request("user0@example.com", `10.0.0.${i}`));
    }
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(FORGOT_BY_EMAIL.limit);
  });
});
