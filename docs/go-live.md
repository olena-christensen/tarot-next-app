# The Veil — Go-Live Status

**Purpose:** the single source of truth for what is done and what remains before The Veil
can take real money from real users. Kept in the repo so it stays current with the code.

**Last updated:** 2026-07-05 (UI-polish session — launch-readiness items below unchanged)

---

## Current state — one line

Legal documents are complete and live. The Plata by mono payment **backend, initiate + result
frontend, recurring-renewal engine, and the free-tier limit + credit-consumption loop** are built
and reviewed. Tokenization is live; the recurring renewal is **verified live on production
(2026-07-02)**: the daily cron charged the saved token, the webhook extended the period +1 month,
and the dunning terminal path downgraded to FREE — both exercised end-to-end against theveil.app.
That e2e surfaced a webhook concurrency bug (a late intermediate delivery could clobber
`Subscription.paymentStatus` back to `processing` after success), now **fixed** (along with a
receipt EUR-amount fix and mailer deliverability headers). What remains: **live-verify the credit +
tier enforcement flow on prod** (the last unchecked core-loop path), decide currency presentation
(UAH settlement), and a lawyer review (not a launch blocker).

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

## ✅ Frontend + monetization loop + recurring (built, reviewed, verified live)

- **Payment frontend:** subscribe/buy CTAs → `create-invoice` → Mono `pageUrl`; `/payment/result` reflects server state (polls `GET /api/user/plan`, never the URL). Plan + credit balance shown in UserProfile.
- **Free-tier + credits:** anon 1/day (localStorage), FREE 3/day (server-counted), credit consumption after the free allotment; MONTHLY/YEARLY unlimited. Server-authoritative; consume path `$transaction` + per-user advisory-lock hardened. Migration `20260629213405_add_reading_user_createdat_index` applied.
- **Recurring renewal:** daily cron `/api/cron/renew` (CRON_SECRET-guarded) → dunning state machine (`renewal.ts`, 12 unit tests) → token charge → renewal-aware webhook (extend period, reset attempts, receipt/dunning emails) → cancel/resume. Migration `add_renewal_fields` applied. **Tokenization confirmed live 2026-06-30; renewal charge + dunning downgrade exercised e2e on theveil.app 2026-07-02.**
- **Webhook + email hardening:** paymentStatus race guard (DB-`WHERE` no-downgrade), receipt EUR amount (`PLAN_PRICES`), mailer deliverability headers (`from` name + `List-Unsubscribe`). SPF/DKIM/DMARC verified passing.

---

## 🔜 Remaining before launch

### Blocking
- [ ] **Live-verify the credit + tier loop on prod:** anon 1 → auth wall; FREE 3 → upsell; €1 SINGLE → 4th reading consumes the credit (UserProfile balance decrements); MONTHLY/YEARLY unlimited. Last unexercised core-loop path.

### Non-blocking
- [ ] **Currency presentation.** Mono settles in UAH (€5 → ~254 UAH at Mono FX); EU cards show UAH on statements. Confirm with Mono whether EUR settlement is possible; decide receipt wording (currently shows advertised EUR price).
- [ ] **`/payment/result` redesign + localize.** Bare spinner + text → branded design across all states; English-only today (top-level route outside `[locale]`, Mono redirect carries no locale — cookie-hop plan in `TODO.md`). Styles: `_payment-result.scss`.
- [ ] **Reconciliation sweep** for a charge stuck at `paymentStatus="created"` if Mono never delivers a terminal webhook (the in-flight guard then freezes the sub — neither re-charged nor downgraded). Exclude healthy subs; note `downgradeToFree` leaves a stale `expiresAt`/`monoCardToken` on the FREE row (harmless today — `getUserPlan` keys off `planId`).

### Fiscal / tax
- [ ] PRRO / digital fiscal receipts (Monobank built-in or Checkbox).
- [ ] Register for EU Non-Union OSS once the first EU customer pays.

### Legal (not a launch blocker)
- [ ] Lawyer review of Terms + Privacy (~$150–400) — copy-paste back into the `*Content.tsx` files if changed. Mono approval needs the docs to exist and be linked (they are), not lawyer-blessed.
- [ ] Terms §18 (exclusive Ukrainian court jurisdiction) vs §19 (binding arbitration, Kyiv) conflict — needs a lawyer's edit.
- [ ] Financial-record retention law vs GDPR cascade-delete of Payment rows — flag for the lawyer review.

### Termly
- [ ] Don't cancel yet — shared Pro+ account; Tattooista still needs it. The Veil is done generating.

_Not live-testable (unit-test covered): a real card decline can't be forced and a `failure` webhook can't be forged, so the retry loop + webhook `failure` branch rely on the 12 `decideRenewalAction` tests._

---

## Where the detail lives
- Payment internals, data model, security, design rationale → `docs/features/mono-payments.md`
- Architecture, gotchas, conventions → `CLAUDE.md`
