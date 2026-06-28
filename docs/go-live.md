# The Veil — Go-Live Status

**Purpose:** the single source of truth for what is done and what remains before The Veil
can take real money from real users. Kept in the repo so it stays current with the code.

**Last updated:** 2026-06-28 (verified against the codebase, not from memory)

---

## Current state — one line

Legal documents are complete and live in the app. The Plata by mono payment **backend and the
initiate + result frontend** are built, documented, and migrated. What remains is surfacing the
credit balance in the persistent UI, credit consumption in the reading flow, recurring renewal
(blocked on monobank tokenization), and a lawyer review (not a launch blocker).

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
- [ ] Surface plan + credit balance in the **persistent** UI. Plan is shown in UserProfile; `GET /api/user/plan` now also returns `readingCredits` (+ `paymentStatus`/`pendingPlanId`) via `getSubscriptionStatus`, and the result page shows the credit count — but UserProfile does not yet display the balance.

### Credit + tier enforcement
- [ ] Reading flow consumes `readingCredits` (a purchased SINGLE credit is stored but never spent yet).
- [ ] Free-tier gating treats a FREE user with `readingCredits > 0` as allowed an extra reading.
- [ ] Free-tier daily limit enforcement (count readings/day) — separate spec, still open.

### Recurring (UNBLOCKING — tokenization enabled by Mono 2026-06-28, live ≈2026-06-30)
- [x] **Get Mono support to enable token operations** ("робота з токенами") — Mono enabled it on the terminal 2026-06-28; active ~48h later (≈2026-06-30).
- [ ] **Re-confirm tokenization works** — after ≈2026-06-30, run a real MONTHLY/YEARLY payment and verify `walletData.cardToken` now lands (`Subscription.monoCardToken` / `Payment.cardToken` populated, not null).
- [ ] Renewal job — charge `monoCardToken` at `nextChargeAt` for MONTHLY/YEARLY via Mono's wallet/payment endpoint. Nothing auto-renews today; subscriptions lapse at `expiresAt`. **(Now the active build — design in progress.)**

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
