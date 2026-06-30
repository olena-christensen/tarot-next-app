# Free-tier daily limit + credit consumption — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a daily free-reading limit (anonymous 1/day, logged-in FREE 3/day), consume purchased `readingCredits` for extra readings, let MONTHLY/YEARLY bypass the limit, and surface the credit balance in UserProfile.

**Architecture:** All draws funnel through one client hook (`useReadingGate`) that generates the reading once, then resolves entitlement — anonymous via a `localStorage` counter, logged-in via a new server-authoritative endpoint `POST /api/readings/consume`. The endpoint counts today's `Reading` rows (UTC), applies pure decision logic, atomically spends a credit when the free allotment is exhausted, and writes a `Reading` row. The pure decision functions are unit-tested in isolation (mirroring `decideRenewalAction`); the route/hook/components are wired to them.

**Tech Stack:** Next.js 14 App Router, NextAuth v4 (`getServerSession`), Prisma v6, next-intl v3, Vitest.

## Global Constraints

- **NEVER run git** (add/commit/stage/push) — the user does all commits. Subagents must not touch git either. Each task ends at a review checkpoint, NOT a commit.
- **ALWAYS use Opus** for any subagent.
- **Prisma schema lives at `src/generated/prisma/schema.prisma`** (not `prisma/`). Do not move it.
- **Prisma client** is the singleton from `@/lib/prisma` — never instantiate `PrismaClient` elsewhere.
- **Pinned versions** — do not upgrade any dependency (Prisma v6, next-intl v3, NextAuth v4, Next 14).
- **No new colors / no hardcoded colors** in any SCSS (not expected in this plan).
- **next-intl:** components use `useTranslations("ui")`; the `credits` key must be added to **all 5** locale `ui.json` files (`en` is source of truth) or it renders as the literal key.
- **UTC** is the day boundary for both the server count and the anonymous counter.
- **Daily limits:** anonymous = 1/day; logged-in FREE = 3/day. Credits spend only after the free allotment is exhausted.
- **Fail open:** a logged-in `consume` call that returns non-200 or throws must ALLOW the reading (never block a legitimate reader on a transient error).

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/readingAccess.ts` (new) | Pure entitlement decision + `utcMidnight` + `FREE_DAILY_LIMIT`. No I/O. |
| `src/lib/readingAccess.test.ts` (new) | Unit tests for `decideReadingAccess`. |
| `src/lib/anonReadingLimit.ts` (new) | Pure anonymous-counter evaluation + constants. No I/O. |
| `src/lib/anonReadingLimit.test.ts` (new) | Unit tests for `evaluateAnonRead`. |
| `src/app/api/readings/consume/route.ts` (new) | Auth-gated POST: count today's readings, decide, atomically spend credit, write `Reading`. |
| `src/hooks/useReadingGate.ts` (new) | Client orchestration: generate once → resolve entitlement → commit or block. |
| `src/AppProvider.tsx` (modify) | Remove reactive generation (the hook now owns it). |
| `src/components/OfferBlock.tsx` (modify) | Route deck click through `beginReading`; remove `FREE_SHAKE_LIMIT`. |
| `src/components/Tarot.tsx` (modify) | Route "Unveil Another Fate" through `beginReading`; accept block callbacks. |
| `src/app/[locale]/HomePageClient.tsx` (modify) | Pass `onOpenLogin`/`onOpenSubscription` to `Tarot`. |
| `src/components/UserProfile.tsx` (modify) | Display `readingCredits`. |
| `src/generated/prisma/schema.prisma` (modify) | Add `@@index([userId, createdAt])` to `Reading` + migration. |
| `messages/{en,no,ru,uk,tr}/ui.json` (modify) | Add `credits` label. |

---

## Task 1: Pure entitlement decision (`readingAccess.ts`)

**Files:**
- Create: `src/lib/readingAccess.ts`
- Test: `src/lib/readingAccess.test.ts`

**Interfaces:**
- Consumes: `PlanId` from `@/lib/plans`.
- Produces:
  - `FREE_DAILY_LIMIT: number` (= 3)
  - `utcMidnight(now: Date): Date`
  - `type ReadingAccessInput = { planId: PlanId; expiresAt: Date | null; readingsToday: number; readingCredits: number }`
  - `type ReadingAccess = { mode: "subscription" } | { mode: "free"; remaining: number } | { mode: "credit" } | { mode: "blocked"; reason: "limit_reached" }`
  - `decideReadingAccess(input: ReadingAccessInput, now: Date): ReadingAccess`

- [ ] **Step 1: Write the failing test**

Create `src/lib/readingAccess.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  decideReadingAccess,
  utcMidnight,
  FREE_DAILY_LIMIT,
  type ReadingAccessInput,
} from "./readingAccess";

const NOW = new Date("2026-06-29T15:00:00.000Z");

function input(overrides: Partial<ReadingAccessInput> = {}): ReadingAccessInput {
  return {
    planId: "FREE",
    expiresAt: null,
    readingsToday: 0,
    readingCredits: 0,
    ...overrides,
  };
}

describe("decideReadingAccess", () => {
  it("active MONTHLY bypasses counting", () => {
    const expiresAt = new Date(NOW.getTime() + 86_400_000);
    expect(decideReadingAccess(input({ planId: "MONTHLY", expiresAt }), NOW)).toEqual({
      mode: "subscription",
    });
  });

  it("active YEARLY bypasses counting", () => {
    const expiresAt = new Date(NOW.getTime() + 86_400_000);
    expect(decideReadingAccess(input({ planId: "YEARLY", expiresAt }), NOW)).toEqual({
      mode: "subscription",
    });
  });

  it("expired MONTHLY falls back to the free path", () => {
    const expiresAt = new Date(NOW.getTime() - 86_400_000);
    expect(decideReadingAccess(input({ planId: "MONTHLY", expiresAt }), NOW)).toEqual({
      mode: "free",
      remaining: FREE_DAILY_LIMIT - 1,
    });
  });

  it("FREE under the daily limit is a free reading with remaining count", () => {
    expect(decideReadingAccess(input({ readingsToday: 1 }), NOW)).toEqual({
      mode: "free",
      remaining: 1,
    });
  });

  it("the last free reading reports remaining 0", () => {
    expect(decideReadingAccess(input({ readingsToday: 2 }), NOW)).toEqual({
      mode: "free",
      remaining: 0,
    });
  });

  it("at the limit with credits → credit mode", () => {
    expect(decideReadingAccess(input({ readingsToday: 3, readingCredits: 2 }), NOW)).toEqual({
      mode: "credit",
    });
  });

  it("at the limit with no credits → blocked", () => {
    expect(decideReadingAccess(input({ readingsToday: 3, readingCredits: 0 }), NOW)).toEqual({
      mode: "blocked",
      reason: "limit_reached",
    });
  });

  it("utcMidnight zeroes the time at the start of the UTC day", () => {
    expect(utcMidnight(NOW).toISOString()).toBe("2026-06-29T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/readingAccess.test.ts`
Expected: FAIL — cannot resolve `./readingAccess`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/readingAccess.ts`:

```ts
import type { PlanId } from "./plans";

/** Daily free readings for a logged-in FREE user. */
export const FREE_DAILY_LIMIT = 3;

/** Start of the current UTC day — the daily-count boundary. */
export function utcMidnight(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export type ReadingAccessInput = {
  planId: PlanId;
  /** Paid-period end, or null. */
  expiresAt: Date | null;
  /** Reading rows already written today (UTC). */
  readingsToday: number;
  /** Current consumable credit balance. */
  readingCredits: number;
};

export type ReadingAccess =
  | { mode: "subscription" }
  | { mode: "free"; remaining: number }
  /** Free allotment exhausted; snapshot shows credits — caller must atomically confirm the spend. */
  | { mode: "credit" }
  | { mode: "blocked"; reason: "limit_reached" };

/**
 * Pure entitlement decision. Priority: active subscriber → free-under-limit →
 * credit → blocked. SINGLE is never a planId (it only adds credits), so only
 * MONTHLY/YEARLY count as a tier here.
 */
export function decideReadingAccess(
  input: ReadingAccessInput,
  now: Date
): ReadingAccess {
  const activeTier =
    (input.planId === "MONTHLY" || input.planId === "YEARLY") &&
    input.expiresAt !== null &&
    input.expiresAt.getTime() > now.getTime();

  if (activeTier) return { mode: "subscription" };

  if (input.readingsToday < FREE_DAILY_LIMIT) {
    return { mode: "free", remaining: FREE_DAILY_LIMIT - (input.readingsToday + 1) };
  }

  if (input.readingCredits > 0) return { mode: "credit" };

  return { mode: "blocked", reason: "limit_reached" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/readingAccess.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Review checkpoint** — do NOT commit (user handles git). Hand back for review.

---

## Task 2: Pure anonymous-counter logic (`anonReadingLimit.ts`)

**Files:**
- Create: `src/lib/anonReadingLimit.ts`
- Test: `src/lib/anonReadingLimit.test.ts`

**Interfaces:**
- Produces:
  - `ANON_DAILY_LIMIT: number` (= 1)
  - `ANON_STORAGE_KEY: string` (= `"theveil_daily_readings"`)
  - `type AnonReadingState = { date: string; count: number }`
  - `utcDateKey(now: Date): string` (UTC `YYYY-MM-DD`)
  - `evaluateAnonRead(stored: AnonReadingState | null, now: Date): { allowed: boolean; next: AnonReadingState }`

- [ ] **Step 1: Write the failing test**

Create `src/lib/anonReadingLimit.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  evaluateAnonRead,
  utcDateKey,
  ANON_DAILY_LIMIT,
} from "./anonReadingLimit";

const NOW = new Date("2026-06-29T15:00:00.000Z");

describe("evaluateAnonRead", () => {
  it("allows the first reading when nothing is stored", () => {
    expect(evaluateAnonRead(null, NOW)).toEqual({
      allowed: true,
      next: { date: "2026-06-29", count: 1 },
    });
  });

  it("blocks once the daily limit is reached today", () => {
    expect(
      evaluateAnonRead({ date: "2026-06-29", count: ANON_DAILY_LIMIT }, NOW)
    ).toEqual({
      allowed: false,
      next: { date: "2026-06-29", count: ANON_DAILY_LIMIT },
    });
  });

  it("resets the count when the stored date is a previous UTC day", () => {
    expect(evaluateAnonRead({ date: "2026-06-28", count: 1 }, NOW)).toEqual({
      allowed: true,
      next: { date: "2026-06-29", count: 1 },
    });
  });

  it("utcDateKey returns the UTC calendar date", () => {
    expect(utcDateKey(NOW)).toBe("2026-06-29");
    // 23:30 in a +offset zone is still the same UTC date here
    expect(utcDateKey(new Date("2026-06-29T23:30:00.000Z"))).toBe("2026-06-29");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/anonReadingLimit.test.ts`
Expected: FAIL — cannot resolve `./anonReadingLimit`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/anonReadingLimit.ts`:

```ts
/** Daily free readings for an anonymous (not-logged-in) visitor. */
export const ANON_DAILY_LIMIT = 1;

/** localStorage key (mirrors the `theveil_cookie_consent` convention). */
export const ANON_STORAGE_KEY = "theveil_daily_readings";

export type AnonReadingState = { date: string; count: number };

/** UTC calendar date as `YYYY-MM-DD`. */
export function utcDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Pure evaluation of the anonymous daily counter. The stored count is treated
 * as 0 whenever its date is not today (automatic UTC-midnight reset). Returns
 * whether the reading is allowed and the state to persist.
 */
export function evaluateAnonRead(
  stored: AnonReadingState | null,
  now: Date
): { allowed: boolean; next: AnonReadingState } {
  const today = utcDateKey(now);
  const count = stored && stored.date === today ? stored.count : 0;

  if (count >= ANON_DAILY_LIMIT) {
    return { allowed: false, next: { date: today, count } };
  }
  return { allowed: true, next: { date: today, count: count + 1 } };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/anonReadingLimit.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Review checkpoint** — do NOT commit.

---

## Task 3: The `Reading` index migration

**Files:**
- Modify: `src/generated/prisma/schema.prisma` (the `Reading` model, ~lines 66-74)

**Interfaces:**
- Produces: an index supporting `Reading.count({ where: { userId, createdAt: { gte } } })`.

- [ ] **Step 1: Add the index**

In `src/generated/prisma/schema.prisma`, change the `Reading` model from:

```prisma
model Reading {
  id        String   @id @default(cuid())
  userId    String
  cards     String[]
  response  String   @db.Text
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

to (add the `@@index` line):

```prisma
model Reading {
  id        String   @id @default(cuid())
  userId    String
  cards     String[]
  response  String   @db.Text
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

- [ ] **Step 2: Create and apply the migration**

Run: `npx prisma migrate dev --name add_reading_user_createdat_index`
Expected: a new migration folder is created and applied to the DB; `prisma generate` runs. (This touches the Neon DB — if the executor lacks DB access, stop and flag for the user to run it.)

- [ ] **Step 3: Verify the client regenerated**

Run: `npx vitest run src/lib/readingAccess.test.ts src/lib/anonReadingLimit.test.ts`
Expected: still PASS (sanity that nothing broke).

- [ ] **Step 4: Review checkpoint** — do NOT commit.

---

## Task 4: The `POST /api/readings/consume` endpoint

**Files:**
- Create: `src/app/api/readings/consume/route.ts`

**Interfaces:**
- Consumes: `getSubscriptionStatus` from `@/lib/subscription`; `decideReadingAccess`, `utcMidnight` from `@/lib/readingAccess`; `authOptions` from `@/lib/auth`; `prisma` from `@/lib/prisma`.
- Produces: `POST` handler returning one of
  - `{ allowed: true, mode: "subscription" }`
  - `{ allowed: true, mode: "free", remaining: number }`
  - `{ allowed: true, mode: "credit", creditsLeft: number }`
  - `{ allowed: false, reason: "limit_reached" }`
  - `401 { error: "Unauthorized" }` / `400 { error: "Invalid body" }`

- [ ] **Step 1: Write the route**

Create `src/app/api/readings/consume/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionStatus } from "@/lib/subscription";
import { decideReadingAccess, utcMidnight } from "@/lib/readingAccess";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { cards, response } = (body ?? {}) as {
    cards?: unknown;
    response?: unknown;
  };
  if (
    !Array.isArray(cards) ||
    cards.length === 0 ||
    !cards.every((c) => typeof c === "string") ||
    typeof response !== "string" ||
    response.length === 0
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const now = new Date();
  const status = await getSubscriptionStatus(userId);
  const readingsToday = await prisma.reading.count({
    where: { userId, createdAt: { gte: utcMidnight(now) } },
  });

  const decision = decideReadingAccess(
    {
      planId: status.planId,
      expiresAt: status.expiresAt ? new Date(status.expiresAt) : null,
      readingsToday,
      readingCredits: status.readingCredits,
    },
    now
  );

  const writeReading = () =>
    prisma.reading.create({
      data: { userId, cards: cards as string[], response: response as string },
    });

  if (decision.mode === "subscription") {
    await writeReading();
    return NextResponse.json({ allowed: true, mode: "subscription" });
  }

  if (decision.mode === "free") {
    await writeReading();
    return NextResponse.json({
      allowed: true,
      mode: "free",
      remaining: decision.remaining,
    });
  }

  if (decision.mode === "credit") {
    // ATOMIC compare-and-set: only succeeds while a credit remains. Mirrors the
    // payment webhook's conditional updateMany (webhook/route.ts:172). Two
    // concurrent draws race here; the loser matches 0 rows and is denied.
    const { count } = await prisma.subscription.updateMany({
      where: { userId, readingCredits: { gt: 0 } },
      data: { readingCredits: { decrement: 1 } },
    });
    if (count === 1) {
      await writeReading();
      return NextResponse.json({
        allowed: true,
        mode: "credit",
        creditsLeft: Math.max(0, status.readingCredits - 1),
      });
    }
    return NextResponse.json({ allowed: false, reason: "limit_reached" });
  }

  // blocked
  return NextResponse.json({ allowed: false, reason: "limit_reached" });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `src/app/api/readings/consume/route.ts`.

- [ ] **Step 3: Manual smoke (optional, requires a logged-in session cookie)**

Note for the reviewer: with a dev session, `curl -X POST localhost:3001/api/readings/consume -H 'Content-Type: application/json' -d '{"cards":["fool","magician","star"],"response":"x"}' --cookie <session>` should return `{ allowed: true, mode: "free", remaining: 2 }` on a fresh day, decrementing each call. Full e2e is exercised through the UI in later tasks.

- [ ] **Step 4: Review checkpoint** — do NOT commit.

---

## Task 5: The `useReadingGate` hook + AppProvider generation move

This task creates the single client orchestration and removes the now-duplicate reactive generation in `AppProvider`. Because `generateReading` uses `Math.random()`, generation must happen exactly once per draw (in the hook), so the persisted text matches what the user sees.

**Files:**
- Create: `src/hooks/useReadingGate.ts`
- Modify: `src/AppProvider.tsx` (remove the generation effect + now-unused imports)

**Interfaces:**
- Consumes: `useAppContext` from `@/AppProvider`; `pickRandomCards` from `@/utils`; `generateReading` from `@/lib/generateReading`; `evaluateAnonRead`, `ANON_STORAGE_KEY`, `AnonReadingState` from `@/lib/anonReadingLimit`.
- Produces: `useReadingGate({ onBlockedAnon, onBlockedFree }): { beginReading: () => Promise<boolean> }`. `beginReading` returns `true` when a reading was dealt (state committed), `false` when blocked.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useReadingGate.ts`:

```ts
"use client";

import { useCallback } from "react";
import { useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/AppProvider";
import { pickRandomCards } from "@/utils";
import { generateReading } from "@/lib/generateReading";
import {
  evaluateAnonRead,
  ANON_STORAGE_KEY,
  type AnonReadingState,
} from "@/lib/anonReadingLimit";

type ReadingGateCallbacks = {
  /** Anonymous visitor hit their daily limit → open the login modal. */
  onBlockedAnon: () => void;
  /** Logged-in FREE user out of free readings and credits → open the subscription modal. */
  onBlockedFree: () => void;
};

function readAnonState(): AnonReadingState | null {
  try {
    const raw = localStorage.getItem(ANON_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.date === "string" && typeof parsed?.count === "number") {
      return parsed as AnonReadingState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeAnonState(state: AnonReadingState): void {
  try {
    localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / storage disabled — ignore; the soft limit is best-effort.
  }
}

export function useReadingGate({
  onBlockedAnon,
  onBlockedFree,
}: ReadingGateCallbacks) {
  const { data: session } = useSession();
  const { state, setState } = useAppContext();
  const messages = useMessages() as any;

  const beginReading = useCallback(async (): Promise<boolean> => {
    // Generate once — this exact text is both displayed and persisted.
    const chosenCards = pickRandomCards({ cards: state.tarots, count: 3 });
    const response = generateReading(
      chosenCards,
      messages,
      messages.ui?.drawThreeCards ?? "Draw three cards to receive your reading.",
      messages.ui?.spiritsUnclear ?? "The spirits are unclear. Please draw again.",
      state.selectedReader
    );

    const commit = () => {
      setState((prev) => ({
        ...prev,
        chosenCards,
        response,
        isResponseLoading: false,
        resetFlipped: true,
        isPredictionReady: false,
        shakeCount: prev.shakeCount + 1,
      }));
    };

    // Anonymous: soft localStorage gate, 1/day.
    if (!session?.user) {
      const { allowed, next } = evaluateAnonRead(readAnonState(), new Date());
      if (!allowed) {
        onBlockedAnon();
        return false;
      }
      writeAnonState(next);
      commit();
      return true;
    }

    // Logged-in: server-authoritative check-and-commit.
    try {
      const res = await fetch("/api/readings/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: chosenCards.map((c) => c.id),
          response,
        }),
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.allowed) {
          commit();
          return true;
        }
        onBlockedFree();
        return false;
      }
      // Non-200 (e.g. 500): fail open — never block a legit reader on a blip.
      commit();
      return true;
    } catch {
      // Network error: fail open.
      commit();
      return true;
    }
  }, [
    session,
    state.tarots,
    state.selectedReader,
    messages,
    setState,
    onBlockedAnon,
    onBlockedFree,
  ]);

  return { beginReading };
}
```

- [ ] **Step 2: Remove the reactive generation from AppProvider**

In `src/AppProvider.tsx`, delete the entire generation effect (currently lines ~85-107):

```tsx
    useEffect(() => {
        if (state.chosenCards.length > 0) {
            setState(prevState => ({
                ...prevState,
                resetFlipped: true,
                isPredictionReady: false,
                isResponseLoading: true,
            }));

            const response = generateReading(
                state.chosenCards,
                messages as any,
                (messages as any).ui?.drawThreeCards ?? "Draw three cards to receive your reading.",
                (messages as any).ui?.spiritsUnclear ?? "The spirits are unclear. Please draw again.",
                state.selectedReader,
            );
            setState(prevState => ({
                ...prevState,
                isResponseLoading: false,
                response: response,
            }));
        }
    }, [state.chosenCards, messages, state.selectedReader]);
```

Then remove the two now-unused lines:
- the import `import {generateReading} from "@/lib/generateReading";` (line 6)
- the `const messages = useMessages();` line (line 73) and its import usage — remove `useMessages` from the `next-intl` import on line 2, leaving `import {} from "next-intl"`? No — check: `useMessages` is the only `next-intl` import in AppProvider (line 2 `import {useMessages} from "next-intl";`). Delete that whole import line.

After this edit, `AppProvider.tsx` no longer references `generateReading`, `messages`, or `useMessages`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. In particular, no "unused variable" or "cannot find name `generateReading`/`messages`" in `AppProvider.tsx`, and the new hook typechecks.

- [ ] **Step 4: Review checkpoint** — do NOT commit. (The hook is not yet called anywhere; OfferBlock/Tarot wire it in Tasks 6-7.)

---

## Task 6: Wire `OfferBlock` to the gate

**Files:**
- Modify: `src/components/OfferBlock.tsx`

**Interfaces:**
- Consumes: `useReadingGate` from `@/hooks/useReadingGate`. `OfferBlock` already receives `onOpenLogin` and `onOpenSubscription` props.

- [ ] **Step 1: Add the import and remove the dead constant**

In `src/components/OfferBlock.tsx`:
- Add near the other imports: `import { useReadingGate } from "@/hooks/useReadingGate";`
- Delete the line `const FREE_SHAKE_LIMIT = 3;` (line 29).

- [ ] **Step 2: Instantiate the gate and rewrite `handleClick`**

Inside the component body, after the existing hooks (e.g. just after `const tReader = useTranslations("readers");`), add:

```tsx
    const { beginReading } = useReadingGate({
        onBlockedAnon: onOpenLogin,
        onBlockedFree: onOpenSubscription,
    });
```

Replace the entire existing `handleClick` (lines ~79-101):

```tsx
    const handleClick = () => {
        const isFree = !planId || planId === "FREE";
        if (isFree && state.shakeCount >= FREE_SHAKE_LIMIT) {
            onOpenSubscription();
            return;
        }

        const chosenCards = pickRandomCards({ cards: state.tarots, count: 3 });
        setState(prevState => ({
            ...prevState,
            chosenCards,
            shakeCount: prevState.shakeCount + 1,
        }));
        setIsDeckShaking(true);
        setTimeout(() => {
            setState(prevState => ({
                ...prevState,
                isCardsModalOpen: true,
            }));
            setIsDeckShaking(false);
        }, 2000);

    };
```

with:

```tsx
    const handleClick = async () => {
        const dealt = await beginReading();
        if (!dealt) return;

        setIsDeckShaking(true);
        setTimeout(() => {
            setState(prevState => ({
                ...prevState,
                isCardsModalOpen: true,
            }));
            setIsDeckShaking(false);
        }, 2000);
    };
```

Note: `pickRandomCards` is no longer used directly in `OfferBlock` — leave its import if still referenced elsewhere in the file; if `npx tsc --noEmit` flags it as unused, remove the `import {pickRandomCards} from "@/utils";` line. (`planId`/`isSubscriber` stay — they still drive reader gating via `setIsSubscriber`.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `OfferBlock.tsx`.

- [ ] **Step 4: Manual verify (anonymous)**

Run `npm run dev`, open an incognito window at `localhost:3001`, summon the reader, click the deck → reading appears. Click the deck again (or "Unveil Another Fate" — wired in Task 7) → the **login modal** opens (anon limit = 1). Clear `localStorage` key `theveil_daily_readings` to retry.

- [ ] **Step 5: Review checkpoint** — do NOT commit.

---

## Task 7: Wire `Tarot` ("Unveil Another Fate") + pass callbacks from `HomePageClient`

**Files:**
- Modify: `src/components/Tarot.tsx`
- Modify: `src/app/[locale]/HomePageClient.tsx`

**Interfaces:**
- Consumes: `useReadingGate` from `@/hooks/useReadingGate`. `Tarot` gains props `{ onOpenLogin: () => void; onOpenSubscription: () => void }`.

- [ ] **Step 1: Give `Tarot` props and the gate**

In `src/components/Tarot.tsx`:
- Add import: `import { useReadingGate } from "@/hooks/useReadingGate";`
- Change the component signature from:

```tsx
export const Tarot = () => {
```

to:

```tsx
type TarotProps = {
    onOpenLogin: () => void;
    onOpenSubscription: () => void;
};

export const Tarot = ({ onOpenLogin, onOpenSubscription }: TarotProps) => {
```

- After the existing hook calls near the top of the component (e.g. after `const allFlipped = flippedCards.every(card => card);`), add:

```tsx
    const { beginReading } = useReadingGate({
        onBlockedAnon: onOpenLogin,
        onBlockedFree: onOpenSubscription,
    });
```

- [ ] **Step 2: Rewrite `handleRetry` to go through the gate**

Replace the existing `handleRetry` (lines ~64-76):

```tsx
    const handleRetry = () => {
        setState(prevState => ({
            ...prevState,
            isPredictionReady: false,
            response: '',
            resetFlipped: true,
            chosenCards: pickRandomCards({ cards: state.tarots, count: 3 }),
            shakeCount: prevState.shakeCount + 1,
        }));
        setFlippedCards([false, false, false]);
        setModalDismissed(false);
        setShowLoader(false);
    };
```

with:

```tsx
    const handleRetry = async () => {
        const dealt = await beginReading();
        if (!dealt) return;

        setFlippedCards([false, false, false]);
        setModalDismissed(false);
        setShowLoader(false);
    };
```

Note: `pickRandomCards` may now be unused in `Tarot.tsx`. If `npx tsc --noEmit` flags it, remove the `import {pickRandomCards} from "@/utils";` line.

- [ ] **Step 3: Pass the callbacks in `HomePageClient`**

In `src/app/[locale]/HomePageClient.tsx`, replace `<Tarot />` (line 27) with:

```tsx
        <Tarot
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenSubscription={() => setIsSubscriptionOpen(true)}
        />
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. `Tarot` now requires both props and they're supplied.

- [ ] **Step 5: Manual verify (logged-in FREE)**

With a FREE logged-in test user, on a fresh UTC day: deck click → reading (×3 allowed, via deck and/or "Unveil Another Fate"). The 4th draw with 0 credits → **subscription modal** opens. Grant a credit (set `Subscription.readingCredits = 1` via `npx prisma studio`), draw again → allowed, credit decrements to 0, the next draw → subscription modal.

- [ ] **Step 6: Review checkpoint** — do NOT commit.

---

## Task 8: Surface the credit balance in `UserProfile` + i18n

**Files:**
- Modify: `src/components/UserProfile.tsx`
- Modify: `messages/en/ui.json`, `messages/no/ui.json`, `messages/ru/ui.json`, `messages/uk/ui.json`, `messages/tr/ui.json`

**Interfaces:**
- Consumes: `GET /api/user/plan` already returns `readingCredits` (via `getSubscriptionStatus`).

- [ ] **Step 1: Add the translation key to all 5 locales**

Add this key inside the top-level `ui` object of each file (place it near `currentPlan` for clarity):

- `messages/en/ui.json`: `"credits": "Reading Credits",`
- `messages/no/ui.json`: `"credits": "Lesningskreditter",`
- `messages/ru/ui.json`: `"credits": "Кредиты раскладов",`
- `messages/uk/ui.json`: `"credits": "Кредити розкладів",`
- `messages/tr/ui.json`: `"credits": "Okuma Kredileri",`

(JSON: ensure commas are valid — the key sits among sibling string keys.)

- [ ] **Step 2: Add credit state and populate it in `UserProfile`**

In `src/components/UserProfile.tsx`:
- Add a state hook next to the other plan state (after `const [autoRenew, setAutoRenew] = useState<boolean>(true);`):

```tsx
  const [credits, setCredits] = useState<number>(0);
```

- In the existing `loadPlan` effect, add `setCredits` inside the `if (res.ok)` block, after `setAutoRenew(...)`:

```tsx
          setCredits(data.readingCredits ?? 0);
```

- [ ] **Step 3: Render the credit field**

Immediately after the `currentPlan` field block (the `</div>` closing the field that ends ~line 357, before the `renewal` conditional block), insert:

```tsx
      <div className="user-profile__field">
        <span className="user-profile__label">{t("credits")}</span>
        <span className="user-profile__value">{credits}</span>
      </div>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verify**

Open the profile for a user with `readingCredits > 0` (set via `npx prisma studio`) → the "Reading Credits" row shows the number. Spend a credit (Task 7 flow) → reopening the profile shows the decremented value.

- [ ] **Step 6: Full build + test gate**

Run: `npm test` → all unit tests pass (readingAccess + anonReadingLimit + existing renewal/mono).
Run: `npm run build` → completes (prisma generate + next build).

- [ ] **Step 7: Review checkpoint** — do NOT commit.

---

## Self-review (completed by plan author)

- **Spec coverage:**
  - Entitlement rules (subscription/free/credit/blocked, anon 1, free 3) → Tasks 1, 4, 5.
  - UTC reset → `utcMidnight` (Task 1) + `utcDateKey` (Task 2).
  - Storage = `Reading` table + index → Tasks 3, 4.
  - `POST /api/readings/consume` with atomic credit decrement → Task 4.
  - Single orchestration covering deck click AND "Unveil Another Fate" → Tasks 5, 6, 7.
  - Anonymous localStorage + auth wall (reuse login modal) → Tasks 2, 5, 6.
  - Logged-in upsell (reuse subscription modal) → Tasks 5, 7.
  - Remove `FREE_SHAKE_LIMIT` → Task 6.
  - Credit balance in UserProfile → Task 8.
  - Fail-open error handling → Task 5 (hook).
  - Reuse existing modals (no bespoke modal copy) → only new string is `credits`.
- **Placeholder scan:** none — every code step shows full code.
- **Type consistency:** `decideReadingAccess`/`ReadingAccess` names match across Tasks 1↔4; `beginReading` signature matches across Tasks 5↔6↔7; `evaluateAnonRead`/`ANON_STORAGE_KEY`/`AnonReadingState` match across Tasks 2↔5.
- **Out of scope (per spec):** in-app currency/crystals, "readings left today" indicator, reading-history UI, tailored block-modal copy.
