import { prisma } from "./prisma";

/**
 * Shared-state throttling for unauthenticated endpoints.
 *
 * State lives in Postgres, not memory: each request may land on a different
 * serverless instance, so an in-process counter would reset unpredictably and
 * protect nothing.
 *
 * Two axes, because they catch different attacks:
 *   - by **subject** (an email address) — catches a targeted brute force spread
 *     across many IPs, which an IP limit cannot see.
 *   - by **IP** — catches volume, including attempts against addresses that
 *     don't exist.
 *
 * Vercel's Firewall covers the IP axis at the edge more cheaply; this is the
 * layer that survives regardless of platform config, and the only layer that
 * can key on an account.
 */

export type RateLimitRule = {
  /** Attempts allowed inside one window. */
  limit: number;
  /** Length of the counting window. */
  windowMs: number;
  /** How long the block lasts once the limit is passed. */
  blockMs: number;
};

export type RateLimitState = {
  count: number;
  windowEndsAt: Date;
  blockedUntil: Date | null;
};

export type RateLimitDecision = {
  /** True when the caller must be refused. */
  blocked: boolean;
  /** Seconds until it frees up — for a Retry-After header. */
  retryAfterSeconds: number;
  /** State to persist. */
  next: RateLimitState;
};

/**
 * Pure transition: given the stored state (or null for a first attempt), decide
 * whether this attempt is allowed and what to store next.
 *
 * Separated from the database so the policy is testable without one — the rules
 * here are the part worth being sure about.
 */
export function decideRateLimit(
  state: RateLimitState | null,
  rule: RateLimitRule,
  now: Date
): RateLimitDecision {
  const nowMs = now.getTime();

  // Already blocked and the block hasn't expired: refuse without counting, so a
  // flood can't keep extending its own punishment forever.
  if (state?.blockedUntil && state.blockedUntil.getTime() > nowMs) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((state.blockedUntil.getTime() - nowMs) / 1000),
      next: state,
    };
  }

  // No state, or the window (or a finished block) has lapsed — start fresh.
  const windowLapsed = !state || state.windowEndsAt.getTime() <= nowMs;
  if (windowLapsed) {
    return {
      blocked: false,
      retryAfterSeconds: 0,
      next: {
        count: 1,
        windowEndsAt: new Date(nowMs + rule.windowMs),
        blockedUntil: null,
      },
    };
  }

  const count = state.count + 1;
  if (count > rule.limit) {
    const blockedUntil = new Date(nowMs + rule.blockMs);
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(rule.blockMs / 1000),
      next: { count, windowEndsAt: state.windowEndsAt, blockedUntil },
    };
  }

  return {
    blocked: false,
    retryAfterSeconds: 0,
    next: { count, windowEndsAt: state.windowEndsAt, blockedUntil: null },
  };
}

/**
 * Record an attempt against `key` and say whether it may proceed.
 *
 * Fails OPEN: if the database is unreachable this returns "not blocked" rather
 * than locking every user out of the app. A throttle that becomes an outage is
 * worse than the attack it prevents.
 */
export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now: Date = new Date()
): Promise<{ blocked: boolean; retryAfterSeconds: number }> {
  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });
    const decision = decideRateLimit(existing, rule, now);

    if (decision.next !== existing) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, ...decision.next },
        update: decision.next,
      });
    }

    return {
      blocked: decision.blocked,
      retryAfterSeconds: decision.retryAfterSeconds,
    };
  } catch (err) {
    console.error("[rateLimit] check failed, allowing", { key, err });
    return { blocked: false, retryAfterSeconds: 0 };
  }
}

/**
 * Wipe a subject's counter after a legitimate success, so a user who mistyped
 * four times and then got it right doesn't stay one slip from a lockout.
 */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (err) {
    console.error("[rateLimit] clear failed", { key, err });
  }
}

/** Rows are bounded by distinct keys, but stale ones are still dead weight. */
export async function pruneRateLimits(olderThan: Date): Promise<number> {
  try {
    const { count } = await prisma.rateLimit.deleteMany({
      where: { windowEndsAt: { lt: olderThan }, blockedUntil: null },
    });
    return count;
  } catch (err) {
    console.error("[rateLimit] prune failed", err);
    return 0;
  }
}

/**
 * The client IP as Vercel sees it. `x-forwarded-for` is a comma-separated chain;
 * the FIRST entry is the original client. Falls back to a constant so a missing
 * header degrades to one shared bucket rather than silently disabling the limit.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

// --- Policies -------------------------------------------------------------
// Chosen to be invisible to a person who forgot their password and expensive
// for a script. A human retries a handful of times; a stuffing run does thousands.

const MINUTE = 60 * 1000;

/** Per email address. The targeted-brute-force axis. */
export const LOGIN_BY_EMAIL: RateLimitRule = {
  limit: 10,
  windowMs: 15 * MINUTE,
  blockMs: 15 * MINUTE,
};

/** Per IP. The volume axis — also covers attempts on addresses that don't exist. */
export const LOGIN_BY_IP: RateLimitRule = {
  limit: 30,
  windowMs: 15 * MINUTE,
  blockMs: 15 * MINUTE,
};

export const REGISTER_BY_IP: RateLimitRule = {
  limit: 5,
  windowMs: 60 * MINUTE,
  blockMs: 60 * MINUTE,
};

export const CONTACT_BY_IP: RateLimitRule = {
  limit: 5,
  windowMs: 60 * MINUTE,
  blockMs: 60 * MINUTE,
};
