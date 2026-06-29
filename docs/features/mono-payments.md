# Plata by mono — Payments

Maintenance doc. Describes the payment feature **as the code currently behaves**, not as
intended. Last verified against the code on 2026-06-25.

## 1. Overview

The Veil is a freemium tarot app. Paid purchases go through **Plata by mono** (monobank
acquiring, JSC Universal Bank), acquiring API v2410. Base currency is **EUR** (`ccy` 978).

Three purchases exist:

| Purchase  | Price | What it grants |
|-----------|-------|----------------|
| `SINGLE`  | €1    | One consumable "extra reading" credit (`readingCredits += 1`). Not a tier. |
| `MONTHLY` | €5    | Recurring monthly subscription tier (`planId = MONTHLY`). |
| `YEARLY`  | €39   | Recurring yearly subscription tier (`planId = YEARLY`). |

Prices live in `PLAN_PRICES` (`src/lib/mono.ts`) in **minor units**: `SINGLE=100`,
`MONTHLY=500`, `YEARLY=3900`.

> Note: the `PlanId` enum (schema) and `src/lib/plans.ts` still list `SINGLE` as a plan
> with a €1 price label. The payment code never sets `planId = "SINGLE"` — SINGLE only ever
> increments `readingCredits`. The recurring tier (`planId`) is only ever `FREE`, `MONTHLY`,
> or `YEARLY` by construction.

## 2. Architecture / flow

```
User clicks subscribe (frontend — NOT BUILT YET)
        │  POST { planId }
        ▼
/api/payments/create-invoice         (auth required)
        │  POST /api/merchant/invoice/create   (X-Token)
        ▼
Mono returns { invoiceId, pageUrl }
        │  upsert Subscription: pendingPlanId + monoInvoiceId, paymentStatus="created"
        │  create Payment ledger row: status="created" (non-fatal, best-effort)
        │  return { pageUrl }
        ▼
Frontend redirects user to Mono's pageUrl
        │  user pays on Mono's hosted page
        ▼
Mono POSTs /api/payments/webhook  (X-Sign signed, raw body)
        │  verify signature → read pendingPlanId → state machine
        │  update Payment ledger row with latest status + card details (no-downgrade)
        ▼
status "success" → activate (atomic): tier upgrade OR +1 credit, save cardToken
```

Two tables are touched on every payment: the **`Subscription`** row (entitlement/state) and the
**`Payment`** ledger row (an append-style audit record, one per invoice). The ledger is written at
invoice creation with status `"created"` and updated by the webhook on each status change — it
records **every attempt**, not just successes. Ledger writes are best-effort: a ledger failure is
logged but never blocks subscription activation (see §5).

After payment Mono redirects the user's browser to `redirectUrl`
(`${NEXT_PUBLIC_APP_URL}/payment/result` — page NOT BUILT YET). Activation does **not**
depend on that redirect; it happens server-side from the webhook.

### create-invoice request to Mono

`POST https://api.monobank.ua/api/merchant/invoice/create` with header `X-Token`, body:

```jsonc
{
  "amount": 500,                       // PLAN_PRICES[plan], minor units
  "ccy": 978,                          // EUR
  "merchantPaymInfo": {
    "reference": "<userId>:<plan>:<Date.now()>",   // correlation/logging only
    "destination": "The Veil — MONTHLY subscription"
  },
  "redirectUrl": "<NEXT_PUBLIC_APP_URL>/payment/result",
  "webHookUrl":  "<NEXT_PUBLIC_APP_URL>/api/payments/webhook",
  "validity": 3600,                    // invoice valid 1 hour
  "saveCardData": { "saveCard": true } // MONTHLY/YEARLY only (tokenization)
}
```

### Status / response codes

- `create-invoice`: `401` no session · `400` bad/missing `planId` · `500` missing
  `NEXT_PUBLIC_APP_URL` · `502` Mono call failed · `500` DB persist failed · `200`
  `{ pageUrl }` on success.
- `webhook`: `400` only for missing `X-Sign`, invalid signature, or unparseable body.
  **Everything else returns `200`** (ack so Mono stops retrying) — including unknown invoice,
  missing fields, and every handled status.

## 3. Files

| File | Role |
|------|------|
| `src/lib/mono.ts` | Config (`MONO_API_BASE`, `CCY_EUR`, `PLAN_PRICES`) + `monoFetch` (X-Token wrapper) + `getMonoPubKey` (cached pubkey) + `verifyMonoWebhook` (signature check). |
| `src/app/api/payments/create-invoice/route.ts` | `POST`. Auth, validate plan, call Mono to create the invoice, upsert the pending purchase on `Subscription`, **create the `Payment` ledger row** (`status="created"`, best-effort), return `pageUrl`. |
| `src/app/api/payments/webhook/route.ts` | `POST`. Verify signature, look up the subscription by `monoInvoiceId`, run the idempotent status state machine, activate on `success`, **and update the `Payment` ledger row** (latest status + card details, no-downgrade, best-effort) on every handled status. |
| `src/lib/subscription.ts` | Read helpers: `getUserPlan(userId)` → tier; `getReadingCredits(userId)` → credit count; `getSubscriptionStatus(userId)` → `{planId, readingCredits, paymentStatus, pendingPlanId, expiresAt, autoRenew}` (used by the result page + UserProfile). |
| `src/lib/renewal.ts` | **Pure** dunning state machine `decideRenewalAction(sub, now)` → `none` / `downgrade(reason)` / `charge`. No DB/network — fully unit-tested (`renewal.test.ts`, 12 cases). |
| `src/lib/mailer.ts` | Best-effort transactional email (Zoho SMTP, reuses the contact-route setup): `sendRenewalReceiptEmail`, `sendPaymentFailedEmail`, `sendSubscriptionEndedEmail`. Never throws. |
| `src/app/api/cron/renew/route.ts` | `GET`, bearer-guarded by `CRON_SECRET`. Daily job: loads MONTHLY/YEARLY subs, applies `decideRenewalAction`, and either downgrades to FREE (+ email) or **initiates** a token charge via `chargeByToken`. Never activates — the webhook does. |
| `src/app/api/user/subscription/route.ts` | `PATCH`, auth-gated. Toggle auto-renew (`{autoRenew}`); sets `canceledAt`. MONTHLY/YEARLY only. |
| `chargeByToken` (in `src/lib/mono.ts`) | Merchant-initiated payment-by-token (`POST /api/merchant/wallet/payment`, `initiationKind:"merchant"`). Drives the same signed webhook as invoice/create. |
| `Subscription` model (`src/generated/prisma/schema.prisma`) | Per-user (`userId @unique`) row holding tier, pending purchase, credits, renewal/dunning state, and Mono bookkeeping. |
| `Payment` model (`src/generated/prisma/schema.prisma`) | Append-style ledger — one row per Mono invoice (`monoInvoiceId @unique`), `@@index([userId])`. Cascade-deletes with the user. |

## 4. Data model

### `Subscription` — fields used by payments

One row per user (`userId @unique`); `create-invoice` upserts it.

| Field | Type | Holds / when written |
|-------|------|----------------------|
| `planId` | `PlanId` enum, default `FREE` | Recurring tier. **Only** set inside the webhook `success` branch, and only to `MONTHLY`/`YEARLY`. Read by `getUserPlan`. |
| `pendingPlanId` | `String?` | The purchase in flight (`"SINGLE"`/`"MONTHLY"`/`"YEARLY"`). Written by `create-invoice`; cleared (`null`) on `success`, `failure`, `reversed`. The webhook reads this to know what was bought — it does **not** parse `reference`. |
| `readingCredits` | `Int`, default `0` | Consumable extra-reading credits. Incremented by 1 on a `SINGLE` `success`. Nothing consumes it yet. |
| `activatedInvoiceId` | `String?` | The `invoiceId` whose `success` was already applied. Idempotency guard. Set during the atomic activation write; reset to `null` by `create-invoice` when a new invoice is issued. |
| `monoInvoiceId` | `String?` | Current Mono `invoiceId`. Written by `create-invoice`; the webhook looks the row up by this. |
| `monoCardToken` | `String?` | Tokenized card for recurring charges. Saved on `success` if Mono sends `walletData.cardToken`. Consumed by the renewal cron (`chargeByToken`). **Inert until monobank enables tokenization** — see §8. |
| `paymentStatus` | `String?` | Last Mono status string (`"created"`, `"processing"`, `"success"`, `"failure"`, `"reversed"`, …). Never downgraded away from `"success"` (see §5). The renewal cron resets it to `"created"` at the start of each attempt. |
| `lastChargedAt` | `DateTime?` | Set to now on `success`. |
| `nextChargeAt` | `DateTime?` | When the renewal cron should next charge. Set to `expiresAt` on a `MONTHLY`/`YEARLY` `success`; `null` after downgrade. Unused for `SINGLE`. |
| `startedAt` | `DateTime`, default now | Set to now on a **first** `MONTHLY`/`YEARLY` purchase; **preserved** (not reset) on a renewal. |
| `expiresAt` | `DateTime?` | First purchase: `now + interval`. Renewal: **prior `expiresAt` + interval** (extends from the existing period so grace days aren't lost). Unused for `SINGLE`. |
| `autoRenew` | `Boolean`, default `true` | `false` = cancel at period end. Toggled by `PATCH /api/user/subscription`. The cron downgrades a `false` sub once `expiresAt` passes. |
| `canceledAt` | `DateTime?` | When the user turned off auto-renew. Cleared on resume. |
| `renewalAttempts` | `Int`, default `0` | Dunning retry counter for the current cycle. Bumped per cron attempt; reset to `0` on a successful renewal and on downgrade. `>= 3` + a failed status → downgrade. |
| `lastRenewalAttemptAt` | `DateTime?` | Spaces retries to at most one per day. |

### `Payment` — ledger (one row per Mono invoice)

Append-style audit record. **Created** by `create-invoice` after Mono returns an invoice (status
`"created"`), then **updated** by the webhook on each status change. The webhook update is a
`updateMany` keyed on `monoInvoiceId` (missing row = safe no-op) and obeys the same no-downgrade
rule as `Subscription`: an intermediate status never overwrites a row already at `"success"`.
Optional card fields are only written when the webhook payload includes them. Cascade-deletes with
the user (`onDelete: Cascade`).

| Field | Type | Holds / when written |
|-------|------|----------------------|
| `id` | `String` cuid | Primary key. |
| `userId` | `String` | Owner. Indexed (`@@index([userId])`). FK to `User`, `onDelete: Cascade`. |
| `monoInvoiceId` | `String @unique` | Mono `invoiceId` — one ledger row per invoice. Written at creation; the webhook matches on it. |
| `reference` | `String?` | Our correlation reference (`<userId>:<plan>:<Date.now()>`). Written at creation. |
| `productType` | `String` | What was bought (`"SINGLE"`/`"MONTHLY"`/`"YEARLY"`). Written at creation; never changed. |
| `amount` | `Int` | Price in minor units (cents). Written at creation from `PLAN_PRICES`. |
| `currency` | `String`, default `"EUR"` | Currency. Written at creation (`"EUR"`). |
| `status` | `String` | Last known status (`"created"` → `"processing"`/`"success"`/`"failure"`/`"reversed"`). Set at creation, advanced by the webhook with no-downgrade. |
| `maskedPan` | `String?` | Masked card number from webhook `paymentInfo.maskedPan`, when present. |
| `paymentSystem` | `String?` | Card scheme (visa/mastercard) from webhook `paymentInfo.paymentSystem`, when present. |
| `failureReason` | `String?` | From webhook `failureReason`, when present. |
| `cardToken` | `String?` | From webhook `walletData.cardToken`, when present (mirrors `Subscription.monoCardToken`). |
| `createdAt` | `DateTime`, default now | Row creation time. |
| `updatedAt` | `DateTime` `@updatedAt` | Last ledger update. |

## 5. Design decisions (the "why")

- **SINGLE is a consumable credit, not a tier.** A one-off reading is fundamentally different
  from a recurring plan. Keeping it in `readingCredits` means `planId` stays a clean
  three-value tier (`FREE`/`MONTHLY`/`YEARLY`) and SINGLE purchases stack without touching
  subscription state.
- **Intended purchase stored in `pendingPlanId`, not parsed from `reference`.** `reference` is
  opaque correlation/log text; encoding business meaning in a string and re-parsing it in the
  webhook is fragile. The DB is the source of truth for what the user is buying.
- **`planId` is only set on confirmed payment**, inside the `success` branch. Therefore
  `getUserPlan` can read `planId` directly and be correct **by construction** — there is no
  window where an unpaid/pending purchase reads as an active tier. (This is why `getUserPlan`
  needs no payment-status check.)
- **Webhook is idempotent via an atomic compare-and-set on `activatedInvoiceId`.** Mono warns
  deliveries can be **duplicated and arrive out of order**. The activation is a single
  conditional write (`updateMany where monoInvoiceId = invoiceId AND activatedInvoiceId = null`).
  Two simultaneous `success` deliveries race on that write; exactly one matches a row and wins,
  the other matches 0 rows and is a no-op. So the credit increment / tier upgrade / cardToken
  save happen **exactly once**. Correctness comes from idempotency, not delivery order — there
  is intentionally no `modifiedDate` comparison.
- **No-downgrade guard on `paymentStatus`.** A late/out-of-order `processing` or `created` (or
  unknown) status must never overwrite a completed payment, so those branches only write
  `paymentStatus` when it is not already `"success"`.
- **`create-invoice` resets `activatedInvoiceId = null`** when issuing a new invoice. The row
  persists per user, so without this reset the `activatedInvoiceId === null` guard would block
  activation of a user's *second* purchase. The fresh `monoInvoiceId` additionally ensures stale
  deliveries for the prior invoice no longer match.
- **Why the `Payment` ledger exists.** `Subscription` holds only current entitlement (one row per
  user, overwritten on each purchase) — it cannot answer "what did this user pay, and when". The
  ledger gives:
  - **Refund support.** The 14-day refund policy needs a durable record of what was actually paid
    (amount, currency, product, card details) to process and justify a refund.
  - **Transaction history independent of the Mono dashboard.** We own our own queryable record
    rather than depending on logging into Mono to reconstruct history.
  - **Every attempt, not just successes.** The row is written at `"created"` (before payment), so
    failed/abandoned/reversed attempts are captured too — useful for support and dispute handling.
- **Ledger writes are non-fatal by design.** Both the create-invoice insert and the webhook update
  are wrapped so a failure is logged and swallowed — it must **never** block subscription
  activation or the webhook's `200` ack. The ledger is bookkeeping layered *on top of* the
  entitlement logic, not a precondition for it.

## 6. Webhook security

- **Raw-body signature verification.** `verifyMonoWebhook(rawBody, xSign)` uses
  `crypto.createVerify("SHA256")` over the **raw request bytes**, verifying the base64-decoded
  `X-Sign` header against Mono's ECDSA public key.
- **Raw body must be read before parsing.** The handler does `const rawBody = await req.text()`
  **first**. The signature is computed over the exact bytes Mono sent; `JSON.parse` +
  re-`stringify` would not round-trip byte-for-byte (key order, whitespace, number formatting),
  which would break verification. Parsing happens only **after** the signature passes.
- **Pubkey caching + refresh-on-failure.** `getMonoPubKey()` fetches
  `GET /api/merchant/pubkey` (response `{ key: base64(PEM) }`, base64-decoded to PEM) and caches
  the PEM in module scope. If verification fails on the first try, `verifyMonoWebhook`
  force-refreshes the key once (handling key rotation) and retries before returning `false`.
- **Fail closed.** Missing `X-Sign` → `400`; failed verification → `400` and no processing.
  Any error thrown during verification is caught and treated as `false` (reject).

## 7. Environment variables

| Var | Purpose |
|-----|---------|
| `MONO_ACQUIRING_TOKEN` | Mono acquiring token, sent as `X-Token` on every Mono API call. Required by `monoFetch` (throws if missing). |
| `NEXT_PUBLIC_APP_URL` | Public origin used to build `redirectUrl` and `webHookUrl`. `create-invoice` returns `500` if unset. Dev: `http://localhost:3001`. |
| `CRON_SECRET` | Bearer secret the renewal cron (`/api/cron/renew`) requires. Vercel attaches it automatically to cron invocations. The route returns `401` if the header mismatches **or** the var is unset. Mark Sensitive. Generate with `openssl rand -base64 32`. |

Both must be set in **`.env` (local)** and in **Vercel** (all relevant environments). In Vercel,
`NEXT_PUBLIC_APP_URL` must be the production origin (e.g. `https://theveil.app`) so Mono can
reach the webhook. `MONO_ACQUIRING_TOKEN` is a secret — mark it Sensitive.

## 8. Recurring renewal engine (built 2026-06-29)

Built but **not yet verified live** — see the prerequisite below. Full design:
`docs/superpowers/specs/2026-06-28-recurring-renewal-design.md`; plan:
`docs/superpowers/plans/2026-06-29-recurring-renewal.md`.

**Flow.** A daily Vercel cron (`vercel.json`, `0 6 * * *`) hits `GET /api/cron/renew`. For each
MONTHLY/YEARLY subscription it calls the pure `decideRenewalAction(sub, now)` and applies the result:

- `none` → skip.
- `downgrade(reason)` → set `planId=FREE`, `nextChargeAt=null`, **reset the dunning fields**
  (`renewalAttempts=0`, `paymentStatus=null`, `canceledAt=null`), and send the "subscription ended"
  email. (Resetting matters: a downgraded row must be pristine so a later resubscribe starts a clean
  dunning cycle.)
- `charge` → **reserve the attempt first** (same bookkeeping as create-invoice: `pendingPlanId=plan`,
  `activatedInvoiceId=null`, `paymentStatus="created"`, bump `renewalAttempts`, set
  `lastRenewalAttemptAt`), then call `chargeByToken`, store the new `monoInvoiceId`, and write a
  `Payment` ledger row. **The cron never activates anything** — Mono fires the existing signed
  webhook, which is the sole activator.

**Webhook is renewal-aware.** It detects a renewal (`pendingPlanId === planId`, both MONTHLY/YEARLY)
and, on `success`, extends `expiresAt` from the prior period, preserves `startedAt`, resets
`renewalAttempts=0`, and sends a receipt (guarded by `count > 0` so a duplicate delivery doesn't
re-email). First-time purchases keep their original behavior. On a renewal `failure`/`reversed` it
sends the dunning email.

**Dunning.** Charge on expiry; keep access during retries; retry once/day; after 3 failed attempts,
downgrade. There is no separate grace timer — the retry cap **is** the grace boundary. The cron
resetting `paymentStatus="created"` each attempt is what keeps the no-downgrade webhook guard from
blocking the `failure` write mid-cycle.

**Cancellation.** `PATCH /api/user/subscription {autoRenew}` — `false` cancels at period end
(access until `expiresAt`, then the cron downgrades), `true` resumes. UserProfile shows the renewal
date + a Cancel/Resume control (MONTHLY/YEARLY only).

**Idempotency / safety.** Reserve-before-charge + the in-flight guard (`paymentStatus` in
`created`/`processing` → `none`) + a fresh `monoInvoiceId` per attempt + the webhook's atomic
`activatedInvoiceId` compare-and-set ⇒ at most one charge per cycle even on a double cron run. The
endpoint is bearer-guarded (`CRON_SECRET`), 401 on mismatch **or** unset.

### Hard prerequisite (gating live verification)
The engine cannot be trusted until a real MONTHLY/YEARLY payment stores a **non-null**
`monoCardToken`. Tokenization was OFF; monobank enabled it 2026-06-28, live ≈2026-06-30. Re-confirm
with a real payment before relying on renewal. Building was possible without it; verification is not.

### Known follow-up (not a blocker)
No reconciliation backstop: if Mono never delivers a terminal webhook for a charge, the sub freezes
at `paymentStatus="created"` (the in-flight guard prevents re-charge and downgrade). Add a
timeout/reconciliation sweep later.

## 8b. STILL NOT BUILT / TODO

- **Reading flow does not consume `readingCredits`.** A purchased SINGLE credit is stored but
  never spent — a €1 purchase currently grants nothing usable.
- **Free-tier daily limit not enforced** (e.g. 3 readings/day) — without it there's no enforced
  reason to pay.
- **Free-tier gating ignores credits.** A "FREE user with `readingCredits > 0`" is not yet treated
  as allowed an extra reading.
- **Credit balance not surfaced in the persistent UI.** `GET /api/user/plan` returns
  `readingCredits`, but UserProfile doesn't display it.
- **PRRO / digital fiscal receipts not wired.** No fiscalization integration.

## 9. Testing notes

- **Mono test environment:** use the test acquiring token; any **Luhn-valid** card number is
  accepted on the test payment page.
- **SINGLE end-to-end works now:** `POST /api/payments/create-invoice { "planId": "SINGLE" }`
  → open the returned `pageUrl` → pay with a test card → Mono calls the webhook → verify
  `readingCredits` incremented by 1 and `paymentStatus = "success"`. The webhook needs a
  publicly reachable `NEXT_PUBLIC_APP_URL` (use a tunnel such as ngrok for local testing, since
  Mono must POST to the `webHookUrl`).
- **Idempotency check:** re-deliver the same `success` payload (or send two concurrently) — only
  one should apply; the rest log `already applied — no-op` and change nothing.
- **Recurring (MONTHLY/YEARLY) cannot be fully tested yet** beyond the first charge: the initial
  invoice activates the tier and stores `monoCardToken`, but actual renewal is blocked on
  tokenization being enabled (§8) and on the renewal job existing.

## 10. Future / legal considerations

- **Financial-record retention vs GDPR cascade-delete.** `Payment` rows currently
  `onDelete: Cascade` with the user, so account deletion erases the full payment history (and the
  deletion-confirmation email lists "payment history" as removed). Bookkeeping/tax law may require
  retaining transaction records (amount, date, VAT) for a fixed period — which could conflict with
  fully cascade-deleting `Payment` on GDPR erasure. Likely resolution down the line is to retain a
  minimised/pseudonymised financial record instead of hard-deleting. **Flag for the eventual
  lawyer review — not a launch blocker.**
