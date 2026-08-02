# The Veil — Go-Live Status

**Purpose:** the single source of truth for what is done and what remains before The Veil
can take real money from real users. Kept in the repo so it stays current with the code.

**Last updated:** 2026-08-02 (avatars done; reading-history UI built with rename/delete/purge; password reset added; both remaining blockers now await live verification only)

---

## Current state — one line

Legal documents are complete and live. The Plata by mono payment **backend, initiate + result
frontend, recurring-renewal engine, and the free-tier limit + credit-consumption loop** are built
and reviewed. Tokenization is live; the recurring renewal is **verified live on production
(2026-07-02)**: the daily cron charged the saved token, the webhook extended the period +1 month,
and the dunning terminal path downgraded to FREE — both exercised end-to-end against theveil.app.
That e2e surfaced a webhook concurrency bug (a late intermediate delivery could clobber
`Subscription.paymentStatus` back to `processing` after success), now **fixed** (along with a
receipt EUR-amount fix and mailer deliverability headers). The **credit + tier enforcement flow is
now verified live on prod (2026-07-13)** — the last unchecked core-loop path. The **payment/monetization
loop has no blockers left**. The two product blockers reopened on 2026-07-14 are now closed as *built*:
**user avatars** ship and are **verified on production (2026-08-01)**, and the advertised
**reading-history** feature has a full UI as of 2026-08-02 (subscriber-gated page, plus rename, single
delete and purge-all) — it is **code-complete but not yet exercised live**, which is the only thing
standing between it and done. **Password reset** ("forgot your password") was added the same day:
hashed single-use tokens, localized email, auto sign-in after reset — also **not yet round-tripped live**.
Remaining non-blocking polish: currency presentation (UAH settlement), fiscal receipts, and a lawyer review.

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

## ✅ Account features (built 2026-08-02, not yet exercised live)

- **Password reset.** `POST /api/auth/forgot-password` → emailed link → `/[locale]/reset-password?token=…` → `POST /api/auth/reset-password`. Only the SHA-256 of a 32-byte token is stored (`PasswordResetToken`, migration `add_password_reset_token`); single-use, 1-hour TTL, a new request retires the old link, 60s per-account throttle. `forgot-password` **always** answers `ok` — unknown address, Google-only account, throttle and mail failure are indistinguishable, so it can't enumerate accounts. Email is localized to `preferredLocale`. On success the user is signed in automatically. Full design in CLAUDE.md → Password Reset.
- **Deleted users are now evicted.** JWT sessions never read the DB, so a `User` row deleted out-of-band (Neon console, GDPR erasure, ban) kept a working session until the token expired — reads silently answered as free-tier, writes 500'd. The `jwt` callback now re-checks the row at most once per 5 minutes (`USER_VERIFY_INTERVAL_MS`) and throws when it's gone, which is how NextAuth v4 clears the cookie. DB errors are caught so a Postgres blip can't sign everyone out.
- **Header slot is auth-dependent.** Signed-out → language globe; signed-in → avatar circle linking to `/profile`.

---

## 🔜 Remaining before launch

### Blocking
- [x] **Live-verify the credit + tier loop on prod** — verified live 2026-07-13: anon 1 → auth wall; FREE 3 → upsell; €1 SINGLE → credit lands and is consumed after the free allotment (UserProfile balance decrements); MONTHLY/YEARLY unlimited. Last unexercised core-loop path — **now cleared**.
- [ ] **Reading-history UI — built 2026-08-02, awaiting live verification.** The advertised MONTHLY feature now has a view, so the plan copy, Privacy Policy and delete-account warning are all truthful.
  - **API:** `GET /api/readings` — auth required; 403 `subscription_required` unless `isActiveTier()` passes (MONTHLY/YEARLY with `expiresAt` in the future). Newest-first, cursor-paginated on row id (`?cursor=<id>&take=<n>`, default 20, max 50); fetches `take + 1` to derive `nextCursor` without a count query.
  - **Page:** `/[locale]/history` — `page.tsx` (metadata, `robots: noindex` like `/profile`) → `HistoryPageClient.tsx` (PageShell, redirects unauthenticated to `/`, gates on `session?.user` not `status`) → `ReadingHistory.tsx`. Each entry: localized date, card thumbnails resolved through the user's `preferredDeck`, card names from `cards.json`, and the stored reading text. "Older Fates" pages through the cursor. A 403 renders the locked panel with a CTA into `SubscriptionModal`.
  - **Profile:** a **Ledger of Fates** row — subscribers navigate to `/history`, everyone else opens the pricing modal.
  - **Shared rule:** `isActiveTier(planId, expiresAt, now)` extracted from `decideReadingAccess` in `readingAccess.ts` so the history gate and the reading gate can never drift. Existing 8 `readingAccess` tests still pass.
  - **i18n:** new `history` namespace in all 5 locales (registered in `request.ts`), plus `seo.history` and `ui.profileHistory`/`profileHistoryOpen` — fully translated, no English placeholders.
  - **Entry management (added 2026-08-02):** entries show date **and time**; each can be renamed (`PATCH /api/readings/[id]`, `Reading.title` nullable column, migration `add_reading_title`) or deleted (`DELETE /api/readings/[id]`), and the whole ledger can be purged (`DELETE /api/readings`). Both destructive actions confirm in a modal first. These three endpoints are auth-only, not subscriber-gated — a lapsed user must still be able to erase their own data.
  - **Not yet done:** verify live as a subscriber (list renders, pagination works, rename/delete/purge round-trip, non-subscriber gets the locked panel).
- [x] **User avatars — done, verified on production 2026-08-01.** Profile-only image upload. Reuses the existing NextAuth `User.image` field (no migration). `POST /api/user/avatar` validates png/jpg/webp ≤2MB, uploads via `@vercel/blob` `put()` (public), saves the URL to `image`, and deletes the previous blob on replace; `auth.ts` now propagates `image` through `session.update()` so the change reflects without re-login. `UserProfile` shows an avatar circle + upload pencil with client-side validation and error states. 
  - **Blob store gotcha:** a store's access mode (public/private) is chosen at creation and **cannot be changed afterwards**. The first store was private, so `put({ access: "public" })` failed with `Cannot use public access on a private store` — surfacing to the browser as a plain 500 / `{error:"upload_failed"}`. Fixed by deleting it and creating a **public** store.
  - **Local dev cannot upload.** `BLOB_READ_WRITE_TOKEN` is auto-created as a **Sensitive** env var, so its value can't be read from the dashboard and `vercel env pull` returns it empty. The documented fallback (OIDC via `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`) fails with `OIDC is enabled for this project, but not for the "development" environment`. Production and preview are unaffected — test avatar changes on a deployment.

- [ ] **Pricing copy advertises seven features that do not exist.** `messages/*/plans.json` is the contract shown on the pricing page and in the in-app modal. Audited against the code 2026-08-02:
  - **MONTHLY — built:** unlimited readings, reading history, choose your deck, choose your diviner. "Ad-free" is true only because the app has no ads at all.
  - **MONTHLY — NOT built:** **long-form interpretations** (`generateReading.ts` has no plan awareness — every tier gets identical text), **daily card email** (no cron; `vercel.json` has only `renew` + `reconcile`), **favorites & personal notes** (no schema, no UI — `Reading.title` is a name, not notes), **reminder notifications** (nothing).
  - **Closed since the audit:** **export readings as PDF** — built 2026-08-02 as a print view (per-entry printer button + `_print.scss`; the browser's "Save as PDF" destination does the conversion, no PDF dependency). The claim is now true.
  - **Decision 2026-08-02:** with no subscribers yet the exposure is theoretical, so the plan is **build the cheap ones, then re-cut the list** — PDF export done, favorites & notes next; long-form interpretations, daily card email, reminder notifications, seasonal decks and early access still to be judged build-vs-cut.
  - **YEARLY — NOT built:** **exclusive seasonal decks** (three decks exist, all available to every subscriber) and **early access to new diviners & decks** (no mechanism).
  - This is the same failure as the reading-history gap, but on **paid** claims: taking €5/month against five unbuilt features is refund and consumer-protection exposure, not just a product gap. **Decide build-vs-cut per line before launch** — cutting is an edit in five JSON files.

### Non-blocking
- [ ] **Currency presentation.** Mono settles in UAH (€5 → ~254 UAH at Mono FX); EU cards show UAH on statements. Confirm with Mono whether EUR settlement is possible; decide receipt wording (currently shows advertised EUR price).
- [x] **`/payment/result`** — done enough 2026-07-13. Localized (`create-invoice` builds `redirectUrl = /{locale}/payment/result`; `payment` namespace in all 5 locales) + `<MysticBackground />` added. Fuller branded redesign deferred — revisit only if wanted. Styles: `_payment-result.scss`.
- [x] **Reconciliation sweep** — built 2026-07-14. Daily cron `/api/cron/reconcile` polls Mono (`getInvoiceStatus`) for any `Payment` row stuck at `created`/`processing` for 30 min–7 days and applies the true status via `applyMonoInvoiceStatus` — the webhook's state machine, extracted so push (webhook) and poll (cron) share one idempotent path (the `activatedInvoiceId` compare-and-set dedupes a cron/webhook race). Bearer-auth via `CRON_SECRET`; `vercel.json` `0 3 * * *` (daily — the Vercel Hobby plan forbids sub-daily crons; a stuck payment is recovered within ~24h, which is fine for a backstop behind the webhook). Not yet exercised live end-to-end (needs a genuinely-lost webhook on prod).

### Platform plan + renewal timing (found 2026-08-02)

- [ ] **Vercel Hobby forbids commercial use — Pro is required before taking real money.** The project runs on the free Hobby plan; Vercel's fair-use guidelines restrict it to non-commercial personal use, and selling subscriptions is commercial. Pro is $20/mo and also raises runtime-log retention from 1 hour to 1 day, which helps the "no alerting" gap below. (CLAUDE.md previously claimed a paid plan — corrected 2026-08-02.)
- [ ] **Renewals lapse for up to ~24h because the charge is scheduled at expiry, not before it.** `decideRenewalAction` only returns `charge` once `now >= expiresAt`, and `expiresAt`/`nextChargeAt` are set to the exact wall-clock time of purchase — but the cron runs once a day (Hobby's limit) at 06:00 UTC, ±59 min. Any subscriber whose renewal moment falls after the cron hour is expired and locked out until the next morning's run. **Observed live 2026-08-02:** `olenakunina@gmail.com` (MONTHLY, auto-renew on, card token saved, 0 failed attempts) expired at 10:15 UTC; the 06:00 run had correctly skipped it because it still had four hours left; next attempt not until 06:00 the following day. `conniearnesenkoch@gmail.com` renews 23 Aug at 17:54 UTC and will hit the same gap.
  - **Fixed 2026-08-02:** `RENEWAL_LEAD_MS` (24h) in `renewal.ts` — a renewal becomes chargeable once `now >= nextChargeAt - 24h`, so the daily cron always gets an attempt in before the period ends and the ±59 min imprecision stops mattering. The downgrade branches still key off the real `expiresAt`: nobody is demoted early, only billed early. 5 new tests cover the boundary (inside window charges, exactly at the boundary charges, one minute outside does not, and neither a canceled nor a token-less sub downgrades early); verified they fail with the lead set to 0. 36 tests pass overall. **Still unverified live** — needs a real renewal to come due.
  - **Lapsed-state display, fixed 2026-08-02:** while a subscription is expired but not yet downgraded by the cron, `planId` still reads MONTHLY/YEARLY. The profile used to show "Current plan: Monthly" beside the free-user paywalls — two contradictory claims on one screen. It now renders `{plan} — expired` with a **Renew** button (`ui.planExpired` / `ui.renewPlan`, all 5 locales) via an `isLapsed` flag. With the lead time in place this state should be rare, but it still occurs for a failed card or a canceled subscription.
- [ ] **Reconcile sweep can't recover payments older than 7 days.** It only inspects `Payment` rows aged 30 min – 7 days, so anything stuck past that window stays stuck forever. Live example: `dantemariya@gmail.com` has a YEARLY invoice at `created` from 28 June with `pendingPlanId: YEARLY` still set — outside the window and now permanently orphaned.

- [x] **Premium readers were paywalled in the UI only** — fixed 2026-08-02. `PATCH /api/user/reader` had no subscription check at all, so any signed-in user could PATCH themselves a premium reader; "Choose your diviner" is a MONTHLY selling point in `plans.json`. It now returns 403 `subscription_required` for any non-default reader without an active tier. Found because an **expired** subscriber could still change reader: entitlement was being derived three different ways in three components (`UserProfile` plan+expiry, `ReaderSelectionModal` planId-only, `OfferBlock` `!== "FREE"`), two of them ignoring expiry. `getSubscriptionStatus` now returns a server-computed `isSubscriber` (via `isActiveTier`) on `GET /api/user/plan` and all three read it. **Still unverified live.**

### Account & platform gaps (audit 2026-08-02)

Found by auditing the app for the *class* of hole that let "forgot your password" ship
un-planned: things a user reasonably expects from an account, and claims made in copy that
the code doesn't back. Ordered by severity.

- [ ] **No email verification.** The `emailVerified` column exists in the schema and is **never written or read** — grep-clean across `src/`. Anyone can register with an address they don't control, so an account can sit on someone else's email until that person tries to reset a password. Decide: verify on sign-up, or accept and document why.
- [ ] **No rate limiting on login or registration.** `api/auth/register` and the credentials provider have none — credential stuffing and password brute force are unthrottled. The only throttle in the app is the 60s per-account one on password reset (2026-08-02). `api/contact` still carries its original "TODO: add rate limiting" comment; the honeypot is its only defence.
- [ ] **No error boundaries.** `src/app` has a single `[locale]/not-found.tsx` and no `error.tsx` / `global-error.tsx` anywhere. Any unhandled render error drops the user on Next's default error screen, outside the app's design.
- [ ] **No alerting.** Both crons and the payment webhook only `console.error`. A failing renewal cron, or webhook signature verification breaking after a Mono key rotation, stays invisible until someone opens Vercel logs. Cheapest fix: have the existing mailer send to `founder@` on cron/webhook failure.
- [ ] **Data portability is claimed but manual.** The Privacy Policy lists a right to portability; there is no export endpoint. Handling it by hand via the DSAR contact route is defensible for a solo operator — worth a decision, not urgent.
- [x] **Reset email bypassed the shared mailer** — fixed 2026-08-02. `api/auth/forgot-password` had built its own nodemailer transporter, losing the `from` display name and `List-Unsubscribe` header that `src/lib/mailer.ts` sets deliberately for deliverability — on the one message most likely to be filtered as spam. Now routed through `sendPasswordResetEmail()` in `mailer.ts`.

**Process note:** this document grew out of a payments checklist and had no section for account-level
expectations or for "does the marketing copy match the code". Both gaps found so far came from that
blind spot. Treat `plans.json` and the legal pages as **contracts to audit against the code** before launch.

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
