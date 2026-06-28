# The Veil — Go-Live Status

**Purpose:** the single source of truth for what is done and what remains before The Veil
can take real money from real users. Kept in the repo so it stays current with the code.

**Last updated:** 2026-06-25 (verified against the codebase, not from memory)

---

## Current state — one line

Legal documents are complete and live in the app. The Plata by mono payment **backend** is
built, documented, and migrated. What remains is the payment **frontend**, credit consumption,
recurring renewal (blocked on monobank tokenization), and a lawyer review (not a launch blocker).

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

## 🔭 Open question — resolve via test, not assumption

- **Is tokenization already enabled on the Mono account?** Recurring charges need Mono's
  token feature ("робота з токенами"). It is OFF by default, but it may already be enabled
  on this account. **Do not assume.** Test: run a MONTHLY or YEARLY payment (which already sends
  `saveCardData`), then check whether `walletData.cardToken` comes back in the webhook. If it
  does → tokenization is on. If not → contact Mono support to enable it. The frontend (below)
  is what makes this test possible.

---

## 🔜 Remaining before launch

### Payment frontend (next feature — own branch)
- [ ] Subscribe / buy buttons wired to `POST /api/payments/create-invoice`, then redirect to the returned `pageUrl` (the `/subscription` page CTAs are currently disabled placeholders).
- [ ] `/payment/result` page — where Mono redirects the user's browser after payment (activation happens server-side via webhook; this page just shows status).
- [ ] Surface plan + credit balance in the UI (`getUserPlan`, `getReadingCredits`).

### Credit + tier enforcement
- [ ] Reading flow consumes `readingCredits` (a purchased SINGLE credit is stored but never spent yet).
- [ ] Free-tier gating treats a FREE user with `readingCredits > 0` as allowed an extra reading.
- [ ] Free-tier daily limit enforcement (count readings/day) — separate spec, still open.

### Recurring (blocked on the tokenization question above)
- [ ] Renewal job — charge `monoCardToken` at `nextChargeAt` for MONTHLY/YEARLY via Mono's wallet/payment endpoint. Nothing auto-renews today; subscriptions lapse at `expiresAt`.

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
