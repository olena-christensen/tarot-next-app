# Recurring Renewal — Design Spec

**Date:** 2026-06-28
**Status:** Approved design, pending implementation plan
**Feature:** Automatic renewal of MONTHLY/YEARLY subscriptions by charging the saved Mono card token, with dunning, cancellation, and transactional emails.

---

## 1. Context

The Plata by mono payment **backend and the initiate+result frontend are built and verified end-to-end on production**. Each MONTHLY/YEARLY payment already sends `saveCardData: { saveCard: true }`, and the webhook already stores the returned card token in `Subscription.monoCardToken` and sets `Subscription.nextChargeAt = expiresAt`. **Nothing charges that token** — today a subscription simply lapses at `expiresAt`.

Tokenization was **OFF** on the Mono account; Mono support enabled it on the terminal on 2026-06-28, going live ~48h later (≈2026-06-30). This spec covers the renewal engine that consumes the stored token.

### Hard prerequisite

The engine cannot function until a real payment actually stores a non-null `monoCardToken`. **Before relying on this feature**, re-confirm (after ≈2026-06-30) that a real MONTHLY/YEARLY payment returns `walletData.cardToken` in the webhook and populates `Subscription.monoCardToken` / `Payment.cardToken`. The engine can be *built* now; it cannot be *verified* until then.

## 2. Goals / Non-goals

**In scope (this slice — a launchable unit):**
- A scheduled job that charges the saved token to renew active MONTHLY/YEARLY subscriptions.
- Dunning: grace period + daily retries on failure, then downgrade.
- Cancellation: users can turn off auto-renew (cancel at period end).
- Transactional emails: payment-failed (dunning) and renewal receipt.

**Out of scope (separate slices):**
- Credit consumption in the reading flow, free-tier daily-limit gating (tracked in `docs/go-live.md`).
- Plan upgrade/downgrade *between* tiers mid-cycle (only same-tier renewal here).
- Proration, partial refunds beyond the existing manual refund path.
- PRRO / fiscal receipts.

## 3. Approved decisions

| Decision | Choice |
|----------|--------|
| Failure handling | **Grace + retries (dunning)** — charge on expiry, keep access during grace, retry daily, downgrade only after retries exhausted. |
| Slice scope | **Engine + cancel + emails** (full launchable unit). |
| Grace window | **3 days** |
| Max retries | **3** (one attempt per day) |
| Cancellation semantics | **At period end** — `autoRenew=false` keeps access until `expiresAt`, then the job downgrades to FREE. |
| Schedule cadence | **Daily** (sufficient; works within Vercel Hobby cron limits). |

## 4. Approach — reuse the existing webhook as the source of truth

The cron **does not activate anything itself**. It *initiates* a token charge using the **same bookkeeping the invoice flow already uses** — set `pendingPlanId` = current plan, store the new charge's `monoInvoiceId`, reset `activatedInvoiceId = null`. Mono then fires the **existing signed webhook**, which already performs idempotent activation (extend period, set `paymentStatus`, write the `Payment` ledger row). The cron's only jobs are **initiating charges** and **managing the dunning state machine** (retry counting, grace, downgrade).

**Rejected alternative:** charge synchronously and activate inline in the cron. This duplicates the webhook's activation logic and risks the two diverging. The webhook is already the proven, idempotent, signature-verified source of truth — reuse it.

## 5. Components

1. **`src/lib/mono.ts`** — add `chargeByToken({ cardToken, amount, reference, destination })`. Calls Mono's merchant-initiated payment-by-token endpoint.
   - Expected endpoint (verify against the live OpenAPI during implementation): `POST /api/merchant/wallet/payment`.
   - Expected body: `{ cardToken, amount, ccy: 978, initiationKind: "merchant", merchantPaymInfo: { reference, destination } }`.
   - Expected response: `{ invoiceId, status, ... }` (same shape family as invoice create). The charge then drives the standard webhook.
2. **`src/app/api/cron/renew/route.ts`** — the renewal job (the dunning state machine in §7). Protected: rejects any request without `Authorization: Bearer ${CRON_SECRET}`.
3. **`vercel.json`** — a daily cron entry → `/api/cron/renew` (e.g. `0 6 * * *`). Vercel automatically attaches `Authorization: Bearer ${CRON_SECRET}` when the env var is set.
4. **Cancellation** — `PATCH /api/user/subscription` sets `autoRenew=false`, `canceledAt=now`; a "Cancel subscription" button in `UserProfile` (re-enable = `autoRenew=true`, clear `canceledAt`, while still subscribed).
5. **Transactional mailer** — `src/lib/mailer.ts`, reusing the Zoho SMTP / nodemailer setup from `src/app/api/contact/route.ts`. Sends two templates: **payment-failed (dunning)** and **renewal receipt**. Best-effort (a mail failure must never block or roll back a charge/activation).
6. **Webhook changes** (`src/app/api/payments/webhook/route.ts`) — small, renewal-aware additions (see §6).

## 6. Data model & webhook changes

### New `Subscription` fields (one Prisma migration)

| Field | Type | Purpose |
|-------|------|---------|
| `autoRenew` | `Boolean @default(true)` | Cancellation toggles this off. |
| `canceledAt` | `DateTime?` | When the user canceled (record / UX). |
| `renewalAttempts` | `Int @default(0)` | Dunning retry counter for the current cycle; reset to 0 on a successful renewal. |
| `lastRenewalAttemptAt` | `DateTime?` | Spaces retries to once per day. |

Reused as-is: `planId`, `expiresAt`, `nextChargeAt`, `monoCardToken`, `paymentStatus`, `lastChargedAt`, `startedAt`, `activatedInvoiceId`, `monoInvoiceId`, `pendingPlanId`.

### Webhook success-branch changes (renewal-aware)

The webhook detects a **renewal** when the activating tier already equals the current tier (`pendingPlanId === planId` and `planId` is MONTHLY/YEARLY). For a renewal:
- `expiresAt = previous expiresAt + interval` (extend from the existing period, **not** `now + interval`, so grace-window days aren't lost).
- **Do not** reset `startedAt` (preserve the original subscription start).
- Reset `renewalAttempts = 0`.

For a first-time purchase (current behavior, unchanged): `planId` was FREE → `expiresAt = now + interval`, `startedAt = now`.

**Webhook also sends the per-charge renewal emails** (best-effort, never blocks activation): on a renewal `success` → **renewal-receipt** email; on a renewal `failure`/`reversed` → **payment-failed (dunning)** email ("we couldn't charge your card — we'll retry, or update it here"). These fire only in the **renewal context** (detected as above) — first-time-purchase failures are not emailed, since the user saw the result live on Mono's page. The final **"subscription ended (payment failed)"** email is sent by the cron at downgrade (§7), not here.

## 7. Daily flow (the dunning state machine)

The cron loads every `Subscription` with `planId in (MONTHLY, YEARLY)` and processes each:

```
if autoRenew == false:
    if now >= expiresAt:        # canceled and period is over
        downgrade to FREE (planId=FREE, nextChargeAt=null)
        send "subscription ended (canceled)" email
    # else: still within paid period — do nothing
    continue

# autoRenew == true (active subscriber)
if monoCardToken is null:
    # cannot renew without a token (e.g. token never captured)
    if now >= expiresAt: downgrade to FREE; send "subscription ended" email
    continue

renewalDue = now >= nextChargeAt
# paymentStatus is reliable here because the cron resets it to "created" at the start
# of EVERY attempt — so during a failing cycle it is never a stale "success", and the
# webhook's no-downgrade guard therefore does NOT block the "failure" update. (See §8.)

# Retries exhausted → give up. "Grace" is simply up to MAX_RETRIES daily attempts: the
# user keeps paid access through those attempts even after expiresAt passes. There is no
# separate grace timer — the retry cap IS the grace boundary.
if renewalAttempts >= MAX_RETRIES (3) and paymentStatus in (failure, reversed):
    downgrade to FREE (planId=FREE, nextChargeAt=null)
    send "subscription ended (payment failed)" email
    continue

if renewalDue and shouldAttempt:
    #   shouldAttempt = paymentStatus is NOT "created"/"processing" (no in-flight charge)
    #   AND (renewalAttempts == 0 OR lastRenewalAttemptAt <= now - 1 day)
    set pendingPlanId = planId, activatedInvoiceId = null, paymentStatus = "created",
        renewalAttempts += 1, lastRenewalAttemptAt = now
    invoiceId = chargeByToken(...)
    store monoInvoiceId = invoiceId
    write Payment ledger row (status "created", productType = planId)
    # → the existing webhook confirms the outcome asynchronously
```

**Webhook outcomes** (existing path + §6 changes):
- **success** → period extended (from prior `expiresAt`), `paymentStatus="success"`, `lastChargedAt=now`, `renewalAttempts=0`, ledger updated. Then a **renewal-receipt email** is sent.
- **failure / reversed** → `paymentStatus="failure"`, `pendingPlanId` cleared. A **payment-failed (dunning) email** is sent. The next daily run sees the failure and, if still under the retry cap (`renewalAttempts < MAX`), retries (one attempt/day); once the cap is reached it downgrades instead.

Receipt and dunning emails are triggered off the confirmed webhook outcome (not the cron's initiation), so they reflect real results.

## 8. Idempotency & safety (real money)

- **One charge per cycle.** Reuse the existing `activatedInvoiceId === null` atomic guard for activation. The cron additionally skips a subscription whose `paymentStatus` is `created`/`processing` (a charge is in flight for the current `monoInvoiceId`) — so a double cron run, or a run overlapping a pending charge, cannot issue a second charge.
- **Why `paymentStatus` is trustworthy for the state machine.** `Subscription.paymentStatus` carries a no-downgrade guard (a late `failure`/`processing` webhook never overwrites `success`). The cron sidesteps this by resetting `paymentStatus = "created"` at the start of every attempt: during a failing renewal cycle the value is therefore never a stale `success`, so the webhook's `failure` update lands normally and the downgrade condition (`renewalAttempts >= MAX and paymentStatus in (failure, reversed)`) is correct. Each attempt also uses a fresh `monoInvoiceId`, so late webhooks for a prior attempt no longer match the subscription row and are safe no-ops.
- **Retry spacing.** `lastRenewalAttemptAt` enforces at most one charge attempt per subscription per day.
- **Daily cadence + the per-cycle guard** mean even an accidental duplicate invocation is safe.
- **Endpoint protection.** `/api/cron/renew` returns 401 unless `Authorization: Bearer ${CRON_SECRET}` matches. Without this, anyone hitting the URL could trigger real charges.

## 9. Cancellation flow

- `PATCH /api/user/subscription` (auth-gated) with `{ autoRenew: false }` → set `autoRenew=false`, `canceledAt=now`. Access continues until `expiresAt`; the daily job downgrades to FREE once the period ends.
- Re-subscribe-before-expiry: `{ autoRenew: true }` → clear `canceledAt`, resume normal renewal.
- `UserProfile` shows current plan + renewal date and a **Cancel subscription** / **Resume** button. Copy makes clear access lasts until the period end.

## 10. Environment variables

| Var | Purpose | Where |
|-----|---------|-------|
| `CRON_SECRET` | Bearer secret the renewal endpoint requires; Vercel attaches it to cron invocations automatically. | `.env`, `.env.local`, **Vercel (Sensitive)** |

(Reuses existing `MONO_ACQUIRING_TOKEN`, `NEXT_PUBLIC_APP_URL`, and the Zoho SMTP vars.)

## 11. Testing

1. **Prerequisite (manual, after ≈2026-06-30):** real MONTHLY/YEARLY payment → confirm `monoCardToken` is stored (token live).
2. **Unit tests** — the dunning state machine in isolation, with Mono and the clock mocked: due/not-due selection, retry spacing, grace-window math, retry-cap downgrade, `autoRenew=false` lapse, missing-token lapse.
3. **Idempotency tests** — duplicate cron run and overlapping pending charge both yield exactly one charge.
4. **Manual e2e** — set a test subscription's `nextChargeAt` to the past, run the cron locally (tunnel so the webhook lands), confirm: charge initiated → webhook → period extended → receipt email. Then simulate a decline to exercise dunning → retry → downgrade.

## 12. Risks / notes

- **Exact Mono endpoint/body** for payment-by-token must be confirmed against the live acquiring OpenAPI during implementation (path and `initiationKind` value especially). Architecture is unaffected by the exact field names.
- **Real charges.** All testing past the prerequisite spends real money on a live token; refund test charges from the Mono cabinet. Consider a Mono **test** acquiring token for repeatable testing.
- **Legal/compliance** (not blocking this code, flag for the eventual review): EU recurring-billing rules generally expect clear pre-charge consent and a renewal reminder; the dunning email partly covers this, but confirm the consent copy at subscribe time is adequate.

## 13. Build order (for the implementation plan)

1. Migration: the four new `Subscription` fields.
2. `chargeByToken` in `mono.ts` (+ confirm endpoint from OpenAPI).
3. Webhook renewal-awareness (§6).
4. `/api/cron/renew` + the dunning state machine (§7) + idempotency guards (§8).
5. `vercel.json` daily cron + `CRON_SECRET` wiring.
6. Cancellation endpoint + `UserProfile` button (§9).
7. Transactional mailer + the two email templates (§5).
8. Tests (§11).
