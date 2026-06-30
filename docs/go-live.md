# The Veil — Go-Live Status

**Purpose:** the single source of truth for what is done and what remains before The Veil
can take real money from real users. Kept in the repo so it stays current with the code.

**Last updated:** 2026-06-30 (verified against the codebase, not from memory)

---

## Current state — one line

Legal documents are complete and live in the app. The Plata by mono payment **backend, the
initiate + result frontend, and the recurring-renewal engine** are built, documented, migrated,
and reviewed. Renewal is code-complete but **unverifiable live until tokenization is re-confirmed**
(≈2026-06-30) — that real-token e2e is the gating step. What remains is surfacing the credit
balance in the persistent UI, credit consumption in the reading flow, the renewal live e2e +
`CRON_SECRET`/deploy, and a lawyer review (not a launch blocker).

---

## ✅ Done

### Legal documents (all hardcoded into the app, Termly markup stripped)
- Privacy Policy — `src/app/privacy/`
- Terms of Service — `src/app/terms/`
- Cookie Policy — `src/app/cookie-policy/`
- Refund Policy — `src/app/refund/` (new route; generated via Termly "Return Policy" tile, all physical-goods language removed)
- Legal-name standard applied across all four: legal entity = **Olena Christensen, Individual Entrepreneur (FOP)**; trade name = **Nothing Weird**; product = **The Veil** ("the Service").
- Hidden Termly DSAR links removed; Termly markup classes stripped; grep-clean.
- Cookie Policy: leaked personal phone number removed.
- All four linked in the footer.

### Payment backend (Plata by mono / JSC Universal Bank, acquiring API v2410)
- **Schema** (three migrations, all applied to Neon):
  - `add_mono_payment_fields` — monoInvoiceId, monoCardToken, paymentStatus, lastChargedAt, nextChargeAt on Subscription
  - `add_pending_plan_and_credits` — pendingPlanId, readingCredits, activatedInvoiceId on Subscription
  - `add_payment_ledger` — new Payment model (one row per invoice, cascade-deletes with user)
- **`POST /api/payments/create-invoice`** — auth-gated; creates a Mono invoice, records the pending purchase + a "created" Payment ledger row, returns `pageUrl`.
- **`POST /api/payments/webhook`** — raw-body ECDSA-SHA256 signature verification (cached pubkey, refresh-on-failure); idempotent state machine with atomic compare-and-set activation and a no-downgrade rule; updates the ledger on every status. Ledger writes are non-fatal.
- **Prices:** SINGLE €1 (consumable reading credit, NOT a tier), MONTHLY €5, YEARLY €39. In `src/lib/mono.ts` as minor units (100 / 500 / 3900), ccy 978 (EUR).
- **Helpers:** `getUserPlan` (unchanged), `getReadingCredits` added in `src/lib/subscription.ts`.
- **Account deletion:** Payment rows cascade-delete with the user; confirmation email lists payment history.
- **Full feature doc:** `docs/features/mono-payments.md` (current, verified against code).

### Business / infrastructure (from prior work)
- FOP registered (єдиний податок 3rd group, 5%); Monobank FOP account.
- Domain, Zoho email + aliases (privacy@ / legal@ / billing@ / support@), DNS/DMARC.
- Mono acquiring token created; stored in `.env` and Vercel as `MONO_ACQUIRING_TOKEN`.
- `NEXT_PUBLIC_APP_URL` set (localhost dev / theveil.app prod).

---

## ✅ Resolved question — tested 2026-06-28

- **Is tokenization enabled on the Mono account? → NO.** Confirmed by a real MONTHLY payment on
  production (`https://theveil.app`) on 2026-06-28: the invoice sent `saveCardData: { saveCard: true }`,
  the webhook fired and activated the tier, but **no `walletData.cardToken` came back** —
  `Subscription.monoCardToken` and `Payment.cardToken` are both `null`. So token operations
  ("робота з токенами") are **OFF** on this account.
  - ➡️ **Update 2026-06-28: Mono support has ENABLED tokenization on the terminal** — it goes live
    **~48h later (≈2026-06-30)**. Must re-confirm with a real MONTHLY/YEARLY payment that the webhook
    now returns `walletData.cardToken`. (Mono's suggested "invoice creates without error" check is NOT
    sufficient — that already passed while tokenization was off.) Once a token is stored, build the
    renewal job.
  - **Bonus:** this same payment verified the **entire payment pipeline end-to-end on production** —
    invoice → Mono hosted page → signed webhook → tier activation (`planId=MONTHLY`,
    `paymentStatus=success`, `expiresAt` = +1 month) → ledger row written (masked PAN, visa). The
    live acquiring token works; the charge was real (≈254.6 UAH).

---

## 🔜 Remaining before launch

### Payment frontend (next feature — own branch)
- [x] Subscribe / buy buttons wired to `POST /api/payments/create-invoice`, then redirect to the returned `pageUrl`. *(done 2026-06-28; per-button busy state, 401 → branded login modal via `LoginContext`, visible error on failure.)*
- [x] `/payment/result` page — top-level route (outside `[locale]`, middleware-bypassed) that reflects server state: re-checks `GET /api/user/plan` every ~1s for ~10s and shows confirming / tier-active / credit-added / still-processing. Never reads the outcome from the URL. *(done 2026-06-28.)*
- [x] Surface plan + credit balance in the **persistent** UI. Plan and the `readingCredits` balance are both shown in UserProfile (done 2026-06-30, part of the core-monetization-loop slice below). `GET /api/user/plan` returns `readingCredits` (+ `paymentStatus`/`pendingPlanId`) via `getSubscriptionStatus`.

### Credit + tier enforcement — BUILT 2026-06-30 (uncommitted; whole-branch review READY-TO-MERGE)
Spec: `docs/superpowers/specs/2026-06-29-free-tier-limit-and-credit-consumption-design.md`; plan: `docs/superpowers/plans/2026-06-29-free-tier-limit-and-credit-consumption.md`.
- [x] Reading flow consumes `readingCredits` — atomic decrement in `POST /api/readings/consume`, only after the daily free allotment is used up.
- [x] Free-tier gating treats FREE + `readingCredits > 0` as an extra reading; MONTHLY/YEARLY bypass the limit. Server-authoritative; fail-open on transient error by design.
- [x] Free-tier daily limit: anonymous **1/day** (soft localStorage), logged-in FREE **3/day** (server-counted via today's `Reading` rows, UTC reset). One client orchestration (`useReadingGate`) gates both the deck click and the "Unveil Another Fate" reshuffle. Migration `20260629213405_add_reading_user_createdat_index` applied to Neon.
- [x] Credit balance now shown in UserProfile (was the open item below).
- [ ] **Verify live before launch:** exercise the full flow against the deployed app — anon 1→auth wall, FREE 3→upsell, buy a €1 SINGLE → 4th reading consumes the credit (UserProfile balance decrements), MONTHLY/YEARLY unlimited.
- [x] **Hardening DONE 2026-06-30:** `$transaction`-wrapped the consume path with a per-user `pg_advisory_xact_lock` — free-tier count→create TOCTOU closed and credit decrement+reading-write made atomic (write failure rolls back the credit). Focused review approved.
- [x] **Cleanup DONE 2026-06-30:** reshuffle button now disabled during the in-flight consume (revived the `isResponseLoading` guard via `useReadingGate`); orphaned `shakeCount` state removed.

### Recurring (UNBLOCKING — tokenization enabled by Mono 2026-06-28, live ≈2026-06-30)
- [x] **Get Mono support to enable token operations** ("робота з токенами") — Mono enabled it on the terminal 2026-06-28; active ~48h later (≈2026-06-30).
- [ ] **Re-confirm tokenization works** — after ≈2026-06-30, run a real MONTHLY/YEARLY payment and verify `walletData.cardToken` now lands (`Subscription.monoCardToken` / `Payment.cardToken` populated, not null). **HARD PREREQUISITE for verifying the renewal engine — it is built but unverifiable live until a token is stored.**
- [x] **Renewal engine BUILT** (2026-06-29, branch `feature/mono-payments`, uncommitted). Plan: `docs/superpowers/plans/2026-06-29-recurring-renewal.md`; spec: `docs/superpowers/specs/2026-06-28-recurring-renewal-design.md`. Daily Vercel cron `/api/cron/renew` (bearer-guarded by `CRON_SECRET`) runs the dunning state machine (`src/lib/renewal.ts`, pure, 12 unit tests via new Vitest setup), charges the saved token (`chargeByToken` in `mono.ts`, endpoint confirmed against live Mono OpenAPI), and lets the existing signed webhook activate (renewal-aware: extend-from-prior-`expiresAt`, reset `renewalAttempts`, receipt/dunning emails via `src/lib/mailer.ts`). Cancel/resume (`PATCH /api/user/subscription` + UserProfile button + i18n ×5). Migration `add_renewal_fields` applied (autoRenew/canceledAt/renewalAttempts/lastRenewalAttemptAt). Built subagent-driven; per-task + whole-branch review clean (one cross-task dunning-reset bug found & fixed).
- [ ] **Remaining to ship renewal:** (1) commit in WebStorm; (2) set `CRON_SECRET` locally + in Vercel (Sensitive) and deploy; (3) local cron smoke test (`curl -H "Authorization: Bearer $CRON_SECRET" …/api/cron/renew`); (4) **live e2e once tokenization is re-confirmed** — set a test sub's `nextChargeAt` to the past (tunnel for the webhook), confirm charge → webhook → period extends → receipt; then simulate a decline to exercise dunning → retry → downgrade.
- [ ] **Follow-up (tracked, NOT a launch blocker — from whole-branch review):** no reconciliation backstop for a charge stuck at `paymentStatus="created"` if Mono never delivers a terminal webhook (the in-flight guard then freezes the sub — neither re-charged nor downgraded). Spec §8/§12 scoped this out; add a reconciliation/timeout sweep later.

### Fiscal / tax
- [ ] PRRO / digital fiscal receipts (Monobank built-in or Checkbox).
- [ ] Register for EU Non-Union OSS once the first EU customer pays.

### Legal (NOT a launch blocker)
- [ ] Lawyer review of Terms + Privacy (~$150–400). The Mono integration does not depend on doc wording; if a lawyer changes text it is a copy-paste back into the `*Content.tsx` files. Mono approval needs the docs to exist and be linked (they are), not lawyer-blessed. Defer until revenue, or to resolve the known issue below.
- [ ] **Known unresolved:** Terms §18 (exclusive Ukrainian court jurisdiction) vs §19 (binding arbitration, Kyiv) conflict. Termly can't fix it; needs a lawyer's edit. Not blocking launch.
- [ ] **Future tension:** financial-record retention law vs GDPR cascade-delete of Payment rows. Flag for the lawyer review. Not blocking.

### Termly housekeeping
- [ ] Do NOT cancel Termly yet — shared Pro+ account; Tattooista still needs it. The Veil itself is done generating.

---

## Deploy checklist (per deploy)
- `MONO_ACQUIRING_TOKEN` set in Vercel (Sensitive).
- `NEXT_PUBLIC_APP_URL` = `https://theveil.app` in Vercel (not localhost).
- Migrations applied to prod (`prisma migrate deploy` runs via build, or apply manually) — the three 2026-06-25 payment migrations included.

---

## Where the detail lives
- Payment internals, data model, security, design rationale → `docs/features/mono-payments.md`
- Architecture, gotchas, conventions → `CLAUDE.md`
