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
| `src/lib/subscription.ts` | Read helpers: `getUserPlan(userId)` → tier; `getReadingCredits(userId)` → credit count. |
| `Subscription` model (`src/generated/prisma/schema.prisma`) | Per-user (`userId @unique`) row holding tier, pending purchase, credits, and Mono bookkeeping. |
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
| `monoCardToken` | `String?` | Tokenized card for future recurring charges. Saved on `success` if Mono sends `walletData.cardToken`. Currently inert (see §8). |
| `paymentStatus` | `String?` | Last Mono status string (`"created"`, `"processing"`, `"success"`, `"failure"`, `"reversed"`, …). Never downgraded away from `"success"` (see §5). |
| `lastChargedAt` | `DateTime?` | Set to now on `success`. |
| `nextChargeAt` | `DateTime?` | Set to `expiresAt` on a `MONTHLY`/`YEARLY` `success` (when the renewal job should charge). Unused for `SINGLE`. |
| `startedAt` | `DateTime`, default now | Reset to now on a `MONTHLY`/`YEARLY` `success`. |
| `expiresAt` | `DateTime?` | `now + 1 month` (MONTHLY) or `now + 1 year` (YEARLY) on `success`. Unused for `SINGLE`. |

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

Both must be set in **`.env` (local)** and in **Vercel** (all relevant environments). In Vercel,
`NEXT_PUBLIC_APP_URL` must be the production origin (e.g. `https://theveil.app`) so Mono can
reach the webhook. `MONO_ACQUIRING_TOKEN` is a secret — mark it Sensitive.

## 8. NOT YET BUILT / TODO

Resume points — none of these exist yet:

- **Tokenization is not enabled by monobank.** Recurring charges will not work until monobank
  support enables token operations ("робота з токенами") for the merchant. `saveCardData:
  { saveCard: true }` is already sent for MONTHLY/YEARLY and `monoCardToken` is saved when
  present, but both are **inert** until support enables the feature.
- **Recurring renewal job not built.** Nothing charges `monoCardToken` at `nextChargeAt`. After
  a MONTHLY/YEARLY `expiresAt` passes, the subscription simply lapses with no auto-renewal.
- **Frontend not built.** No subscribe button / pricing CTA wired to `POST
  /api/payments/create-invoice`, and no `/payment/result` page for the post-payment redirect.
- **Reading flow does not consume `readingCredits`.** A purchased SINGLE credit is stored but
  never spent.
- **Free-tier gating ignores credits.** Free-tier enforcement does not yet treat a "FREE user
  with `readingCredits > 0`" as allowed an extra reading.
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
