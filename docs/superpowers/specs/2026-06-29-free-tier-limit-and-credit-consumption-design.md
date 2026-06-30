# Free-tier daily limit + credit consumption — design

**Date:** 2026-06-29
**Status:** Approved (brainstorm), pending implementation plan
**Slice:** The core monetization loop — the next slice after recurring renewal.

---

## Problem

Today a tarot reading is generated **100% client-side** (`AppProvider.tsx` → `generateReading.ts`,
a pure function over translated JSON). There are **zero server calls and zero DB writes** during a
reading, and **anyone — logged in or not — can read unlimited times for free.**

Consequences:
- A purchased **SINGLE €1 `readingCredits`** is incremented by the payment webhook but **never
  spent** — a €1 purchase currently grants nothing usable.
- There is **no enforced reason to subscribe** — MONTHLY/YEARLY buy nothing the free flow doesn't
  already give away.
- The existing `FREE_SHAKE_LIMIT = 3` in `OfferBlock.tsx` is **UI-only** — a nudge, not a limit.

This slice makes payments mean something: a daily free limit, real credit consumption, and tier
bypass.

## Altitude / threat model (explicit)

Because the reading text is generated client-side, **no gate can be made tamper-proof** — a
determined user can always extract the reading from the client. This feature is therefore an
**honest freemium gate that the normal app respects**, not anti-piracy. That is the correct
altitude for an entertainment app. The hard, un-bypassable parts (credits, unlimited) live behind
auth precisely because the money already does.

---

## Entitlement rules

When a draw is initiated, exactly one outcome is resolved, in priority order:

| User state | Outcome |
|---|---|
| **MONTHLY / YEARLY** (active, not expired) | ✅ Unlimited — bypass counting, no credit touched |
| **FREE, < 3 readings today** | ✅ Free reading — counted |
| **FREE, used 3, `readingCredits > 0`** | ✅ Spend 1 credit (atomic), allow reading |
| **FREE, used 3, 0 credits** | ❌ Blocked → upsell (`/subscription`) |
| **Anonymous, 0 readings today** | ✅ 1 free reading (localStorage) |
| **Anonymous, used their 1** | ❌ Blocked → auth wall (login modal) |

**Decisions locked in brainstorm:**
- **Daily limit:** anonymous = **1/day**; logged-in FREE = **3/day**.
- **Reset:** **00:00 UTC** for both (simplest; "come back tomorrow" messaging).
- **Credit ordering:** credits are spent **only after** the daily free allotment is exhausted —
  never while free readings remain. A €1 credit always buys a 4th+ reading that day.
- **Anonymous credits:** N/A — you cannot buy without an account, so anonymous users never have
  credits.

---

## Architecture

### Storage: the existing `Reading` table (one row per reading)

The `Reading` model exists in `src/generated/prisma/schema.prisma` but is **completely unused
today**. We adopt it as the source of truth for the daily count. Chosen over a counter field
because:

1. **FREE users usually have no `Subscription` row** (absence = FREE, the existing convention). A
   counter on `Subscription` would force a row for every free user. `Reading` keys on `userId`
   directly.
2. **No reset job.** "Readings today" = `count(Reading where userId = ? and createdAt >= UTC
   midnight)`. The midnight reset is automatic — old rows stop matching. Nothing to schedule.
3. **Free history.** Writing a row per reading gives the future reading-history UI at zero extra
   cost.

**Schema change:** add `@@index([userId, createdAt])` to `Reading` (one migration via
`prisma migrate dev`). Each row stores `userId`, `cards` (3 ids), `response` (full text, client
already has it), `createdAt`.

### Server endpoint: `POST /api/readings/consume`

Auth-gated, atomic **check-and-commit**. Anonymous users never call it. Mirrors the existing
`/api/user/*` route conventions (`getServerSession(authOptions)` → 401 if no session).

**Request:** `{ cards: string[], response: string }`
**Response (200):** one of
- `{ allowed: true, mode: "subscription" }`
- `{ allowed: true, mode: "free", remaining: number }`
- `{ allowed: true, mode: "credit", creditsLeft: number }`
- `{ allowed: false, reason: "limit_reached" }`

**Logic:**

```
session → userId            // 401 if none
status = getSubscriptionStatus(userId)

if plan ∈ {MONTHLY, YEARLY} and expiresAt in future:
    create Reading row
    return { allowed: true, mode: "subscription" }

count = Reading.count(userId, createdAt >= utcMidnight())
if count < 3:
    create Reading row
    return { allowed: true, mode: "free", remaining: 3 - (count + 1) }

// daily free exhausted → atomic credit spend (compare-and-set, same pattern as payment webhook)
updated = Subscription.updateMany(
    where: { userId, readingCredits: { gt: 0 } },
    data:  { readingCredits: { decrement: 1 } })
if updated.count === 1:
    create Reading row
    creditsLeft = (re-read or status.readingCredits - 1)
    return { allowed: true, mode: "credit", creditsLeft }

return { allowed: false, reason: "limit_reached" }   // no row written
```

**Validation:** `cards` must be a non-empty `string[]`; `response` a non-empty string. Reject
otherwise (400). Server errors are logged. Client handling of non-200 responses is defined in
**Error handling** below (the logged-in path fails open).

### Helper

Add `utcMidnight()` (start of current UTC day) — small local util, used by the endpoint. No new
dependency.

---

## Client flow

### Single orchestration: `useReadingGate` → `beginReading()`

All draws funnel through one async path. It MUST cover **both** triggers:
- the deck click on the main page (`OfferBlock.tsx`), and
- **"Unveil Another Fate"** (the in-modal reshuffle in `Tarot.tsx`) — a second reading; gating it
  is mandatory or the limit leaks.

**Sequence:**

```
1. Pick 3 cards + generate response (client-side, instant, pure)
2. Resolve entitlement:
   • Anonymous → read localStorage counter
       - allowed → bump counter, proceed
       - blocked → open AUTH WALL (login modal), do NOT deal
   • Logged-in → await POST /api/readings/consume { cards, response }
       - allowed → proceed
       - blocked → open UPSELL modal, do NOT deal
3. allowed → set chosenCards/response → cards modal opens → flip → reveal (existing flow untouched)
   blocked → open block modal; no cards dealt
```

**Latency is invisible:** the cards modal already opens after a ~2s delay (`OfferBlock` today). The
`consume` call (~100–300ms) fits inside that window. The flip animation is pure theater over an
already-committed reading.

### Anonymous localStorage

Key: `theveil_daily_readings`, value `{ date: "<UTC YYYY-MM-DD>", count: number }`. Mirrors the
existing `theveil_cookie_consent` localStorage convention.

On draw: if `date !== todayUTC` → reset `{ date: todayUTC, count: 0 }`; if `count < 1` → allow +
increment; else → auth wall.

### Blocked-state UX — reuse existing surfaces

- **Anonymous, used their 1 → auth wall.** Reuse the branded login modal already wired via
  `LoginContext` (the same one payments opens on a 401). Tailored copy: "Sign in to continue — your
  first reading is on us."
- **Logged-in FREE, used 3 + 0 credits → upsell.** Modal with copy "You've drawn your 3 readings
  today" and CTAs routing to `/subscription` (subscribe / buy a single). Resets at 00:00 UTC.

New UI strings for both block states are added to all 5 locale `ui.json` files (EN source of
truth; others may fall back).

### Cleanup

Remove the UI-only `FREE_SHAKE_LIMIT = 3` logic in `OfferBlock.tsx` — this gate replaces it.

### Credit balance in UserProfile (included in this slice)

`GET /api/user/plan` already returns `readingCredits` via `getSubscriptionStatus`. Surface it in
`UserProfile` next to the plan (same pattern as the existing plan/deck/reader rows). Small,
half-done already.

**Deferred (own follow-up):** a "readings left today" indicator on the main page.

---

## Error handling

- **`consume` returns non-200 / network error (logged-in):** fail **open** for the user
  experience — allow the reading to proceed (do not block a paying-capable user on a transient
  server error), but log the failure. Rationale: the cost of a rare over-grant is far lower than
  blocking a legitimate reader on a blip, and the reading itself is already client-side free. (This
  is a deliberate product call; revisit if abuse appears.)
- **Atomic credit decrement race:** the `updateMany ... where readingCredits > 0` guard guarantees
  two concurrent draws can't double-spend one credit; the loser falls through to
  `limit_reached`.
- **Reading row write fails after entitlement resolved:** log; do not fail the user's reading. (The
  count is best-effort; a missed write at worst grants one extra free reading.)

---

## Out of scope (explicit)

- **In-app currency ("crystals").** `readingCredits` is already a generic integer balance; a
  crystal economy is a future pricing/packaging change (sell packs, variable spend per
  reader/deck), **not** an architecture change — the consume endpoint already decrements a balance.
  Parked as a future spec.
- "Readings left today" indicator (deferred above).
- Reading-history UI (the `Reading` rows now enable it later).
- Per-locale tailoring of block-modal copy beyond standard `ui.json` translation.

---

## Files touched (anticipated)

- `src/generated/prisma/schema.prisma` — add `@@index([userId, createdAt])` to `Reading` (+ migration).
- `src/app/api/readings/consume/route.ts` — **new** endpoint.
- `src/lib/` — `utcMidnight()` util (and possibly a `consumeReading` server helper).
- `src/hooks/` (or co-located) — **new** `useReadingGate` / `beginReading`.
- `src/components/OfferBlock.tsx` — route deck click through `beginReading`; remove `FREE_SHAKE_LIMIT`.
- `src/components/Tarot.tsx` — route "Unveil Another Fate" through `beginReading`.
- `src/AppProvider.tsx` — adjust so generation + commit are coordinated by the gate.
- Block modals — reuse `LoginContext` modal (anon) + a small upsell modal (or reuse subscription surface).
- `src/components/UserProfile.tsx` — show `readingCredits`.
- `messages/{en,no,ru,uk,tr}/ui.json` — new block-state + credit-balance strings.

## Testing notes

- Anonymous: 1 reading allowed, 2nd shows auth wall; localStorage resets on UTC date change.
- Logged-in FREE: 3 allowed, 4th with 0 credits → upsell; with 1 credit → 4th allowed, credit
  decrements to 0, 5th → upsell.
- Concurrent credit spend: two simultaneous draws with `readingCredits = 1` → exactly one succeeds.
- MONTHLY/YEARLY: unlimited; Reading rows still written (history).
- UTC midnight: readings before/after boundary count against the correct day.
