import { describe, it, expect } from "vitest";
import {
  decideRateLimit,
  clientIp,
  type RateLimitRule,
  type RateLimitState,
} from "./rateLimit";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const RULE: RateLimitRule = { limit: 3, windowMs: 60_000, blockMs: 300_000 };
const at = (ms: number) => new Date(NOW.getTime() + ms);

const state = (over: Partial<RateLimitState> = {}): RateLimitState => ({
  count: 1,
  windowEndsAt: at(60_000),
  blockedUntil: null,
  ...over,
});

describe("decideRateLimit", () => {
  it("allows a first attempt and opens a window", () => {
    const d = decideRateLimit(null, RULE, NOW);
    expect(d.blocked).toBe(false);
    expect(d.next.count).toBe(1);
    expect(d.next.windowEndsAt).toEqual(at(60_000));
  });

  it("counts up to the limit without blocking", () => {
    expect(decideRateLimit(state({ count: 1 }), RULE, NOW).blocked).toBe(false);
    expect(decideRateLimit(state({ count: 2 }), RULE, NOW).blocked).toBe(false);
  });

  it("blocks the attempt that passes the limit", () => {
    const d = decideRateLimit(state({ count: 3 }), RULE, NOW);
    expect(d.blocked).toBe(true);
    expect(d.next.blockedUntil).toEqual(at(300_000));
    expect(d.retryAfterSeconds).toBe(300);
  });

  it("keeps refusing while blocked, and reports the real remaining time", () => {
    const blocked = state({ count: 9, blockedUntil: at(120_000) });
    const d = decideRateLimit(blocked, RULE, NOW);
    expect(d.blocked).toBe(true);
    expect(d.retryAfterSeconds).toBe(120);
  });

  it("does not let a flood extend its own block", () => {
    // Attempts made while blocked must not increment the count, or an attacker
    // hammering the endpoint would keep pushing their own release further out.
    const blocked = state({ count: 9, blockedUntil: at(120_000) });
    expect(decideRateLimit(blocked, RULE, NOW).next.count).toBe(9);
  });

  it("frees up once the block expires", () => {
    const expired = state({ count: 9, blockedUntil: at(-1_000), windowEndsAt: at(-1_000) });
    const d = decideRateLimit(expired, RULE, NOW);
    expect(d.blocked).toBe(false);
    expect(d.next.count).toBe(1);
    expect(d.next.blockedUntil).toBeNull();
  });

  it("starts a new window once the old one lapses", () => {
    const stale = state({ count: 3, windowEndsAt: at(-1) });
    const d = decideRateLimit(stale, RULE, NOW);
    expect(d.blocked).toBe(false);
    expect(d.next.count).toBe(1);
  });

  it("treats the window boundary as lapsed, not as one last attempt", () => {
    const d = decideRateLimit(state({ count: 3, windowEndsAt: NOW }), RULE, NOW);
    expect(d.blocked).toBe(false);
  });
});

describe("clientIp", () => {
  it("takes the first entry of x-forwarded-for", () => {
    // The chain is client, proxy, proxy — only the first is the real client.
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 10.0.0.2" });
    expect(clientIp(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
  });

  it("degrades to one shared bucket rather than no limit at all", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
