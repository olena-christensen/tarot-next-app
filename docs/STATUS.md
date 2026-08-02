# The Veil — Status & Roadmap (single consolidated doc)

**This file supersedes** the former root `TODO.md`, `TODO-ui.md`, `NICE-TO-HAVE.md`
and `docs/go-live.md` — everything from all four lives here, in one place, plus the
business/operational items that previously existed only in the Claude project notes.
Deep implementation detail stays where it was: payments → `docs/features/mono-payments.md`,
architecture/conventions → `CLAUDE.md`.

**Last updated:** 2026-08-02

**How to read:** sections are collapsible. Open the ones you're working on.
Ordered roughly by "blocks taking real money" first; the Done archive is at the bottom.

---

## Current state — one paragraph

Legal documents are complete and live. The Plata by mono payment backend, initiate +
result frontend, free-tier limit + credit-consumption loop, and recurring-renewal engine
are built and **verified live on production**: tokenization 2026-06-30, renewal charge +
dunning downgrade end-to-end 2026-07-02, credit + tier enforcement 2026-07-13. User
avatars verified on production 2026-08-01. Built on 2026-08-02 and **code-complete but
not yet exercised live**: reading-history UI (with rename / delete / purge-all and
print-to-PDF), password reset, deleted-user session eviction, the 24-hour renewal lead
window, and the premium-reader server-side gate. What actually remains before launch:
those live-verification passes, the pricing-copy honesty audit (build-vs-cut per
advertised feature), the Vercel Pro upgrade, translation quality proofread, and the
fiscal / legal / operational items below.

---

<details open>
<summary><b>🔴 Blocking — before taking real money</b></summary>

### Platform

- [ ] **Upgrade Vercel to Pro ($20/mo).** The project runs on the free Hobby plan, whose
  fair-use terms restrict it to non-commercial personal use — selling subscriptions is
  commercial. A terms problem, not technical: renewals work fine on Hobby (its only limit
  is one scheduled job per day, which the 24-hour renewal lead window covers). Pro also
  raises runtime-log retention from 1 hour to 1 day, which softens the "no alerting" gap.
  Do it at launch, not after.

### Live-verification passes (code done, needs a real round-trip on production)

- [ ] **Reading history** — verify as a subscriber: list renders, cursor pagination
  ("Older Fates"), rename / single-delete / purge-all round-trip, and a non-subscriber
  hitting `/history` gets the locked panel → pricing modal. (API: `GET /api/readings`,
  subscriber-gated via `isActiveTier()`; entry management endpoints are auth-only, NOT
  subscriber-gated, so a lapsed user can still erase their data. Full design notes in
  the Done archive below.)
- [ ] **Password reset** — send a real email, redeem a real token, confirm auto sign-in.
  (Hashed single-use tokens, 1-hour lifetime, 60-second per-account throttle,
  enumeration-safe responses. Design in `CLAUDE.md` → Password Reset.)
- [ ] **Deleted-user eviction** — delete a test user out-of-band, wait 5 minutes, hit any
  page, confirm the session dies (the JSON Web Token callback re-checks the user row at
  most every 5 minutes and throws when it's gone).
- [ ] **Renewal lead window** — `RENEWAL_LEAD_MS` (24 h) makes a renewal chargeable up to
  24 h before expiry so the once-daily 06:00 UTC job never strands a subscriber for a day.
  5 boundary tests pass; needs a real renewal to come due. Watch:
  `conniearnesenkoch@gmail.com` renews 23 Aug ~17:54 UTC — the 06:00 run that morning
  should charge it early.
- [ ] **Premium-reader gate** — `PATCH /api/user/reader` now returns 403
  `subscription_required` for any non-default reader without an active tier (was
  UI-only paywall). Verify live, including the expired-subscriber case.

### Pricing copy vs code — the honesty audit (2026-08-02)

`messages/*/plans.json` is the contract shown on the pricing page and in the in-app
modal. Taking €5/month against unbuilt features is refund and consumer-protection
exposure, not just a product gap. Decision: **build the cheap ones, then re-cut the
list**. Cutting a line = editing five JSON files.

| Advertised claim | Status |
|---|---|
| Unlimited readings (MONTHLY) | ✅ built |
| Reading history (MONTHLY) | ✅ built (awaiting live verify, above) |
| Choose your deck / your diviner (MONTHLY) | ✅ built |
| Ad-free (MONTHLY) | ✅ trivially true — the app has no ads at all |
| Export readings as PDF (MONTHLY) | ✅ built 2026-08-02 — print view per entry, browser "Save as PDF" does the conversion |
| Favorites & personal notes (MONTHLY) | ❌ not built — **next up** (no schema, no UI; `Reading.title` is a name, not notes) |
| Long-form interpretations (MONTHLY) | ❌ not built (`generateReading.ts` has no plan awareness) — judge build-vs-cut |
| Daily card email (MONTHLY) | ❌ not built (no scheduled job for it) — judge build-vs-cut |
| Reminder notifications (MONTHLY) | ❌ not built — judge build-vs-cut |
| Exclusive seasonal decks (YEARLY) | ❌ not built (all three decks available to every subscriber) — judge build-vs-cut |
| Early access to new diviners & decks (YEARLY) | ❌ not built (no mechanism) — judge build-vs-cut |

### Translations — native-level QUALITY proofread

Coverage is 100% (verified 2026-07-14, key-by-key against English — 0 missing / 0 empty /
0 untranslated across all locales × namespaces; remaining English-identical keys are
intentional brand/proper names). What's left is how it *reads*:

- [ ] **Russian** — rough app-wide. Formal "вы" in all UI, gender-neutral readings (no
  gendered past-tense with "ты"), "таролог" never "гадалка", brand = "Завеса". Reader
  voice lines may use "ты" in-character. Full rules: `CLAUDE.md` i18n section.
- [ ] **Ukrainian** — full naturalness pass (brand = "Завіса", "таролог").
- [ ] **Turkish** — full pass (machine-assisted, needs a native eye).
- [ ] **Norwegian** — light sanity pass.
- [ ] **Reading-history + password-reset strings (2026-08-02)** — written translated (not
  placeholders) but want the same native eye; especially the reset **email** copy, the
  only user-facing text sent outside the app.
- [ ] **Profile page labels + avatar strings — still English placeholders in no/ru/uk/tr.**
  16 `ui` keys (`profileTitle`, `profileName`, `profileEmail`, `profilePlan`,
  `profileCredits`, `profileDeck`, `profileReader`, `profileLanguage`, `profilePassword`,
  `profileBreakSeal`, `profileForgeSeal`, `profileAvatar`, `profilePictureAria`,
  `avatarTooLarge`, `avatarBadType`, `avatarUploadFailed`). Voice: mystic / ironic /
  cult-like, never self-describing. Flagged `[TRANSLATE]` in `translation-review/*.csv`.

</details>

---

<details open>
<summary><b>🟠 Fiscal, legal & Termly</b></summary>

- [ ] **PRRO — Ukrainian program-based fiscal cash register** (програмний реєстратор
  розрахункових операцій), for legally required digital receipts: Monobank's built-in or
  Checkbox. The webhook sends an *email* receipt; that is not a fiscal receipt. The one
  genuine integration gap left in the money path.
- [ ] **European Union "Non-Union One Stop Shop" value-added-tax registration** — required
  once the first EU consumer pays; register then, not before.
- [ ] **Lawyer review of Terms + Privacy** (~$150–400 in Ukraine). Mono approval only
  needed the docs to exist and be linked (they are), not lawyer-blessed. Copy edits back
  into the `*Content.tsx` files if changed. Specifically flag:
  - Terms §18 (exclusive Ukrainian court jurisdiction) vs §19 (binding arbitration,
    Kyiv) — the two clauses conflict.
  - Financial-record retention law vs the GDPR cascade-delete of `Payment` rows.
- [ ] **Termly: do NOT cancel yet.** Shared Pro+ account across all Nothing Weird
  projects; Tattooista still needs the generator. The Veil is done generating — its docs
  are self-hosted and grep-clean (`termly`, `termly.io`, `/dsar/`, markup classes: zero
  hits), so the live site has no Termly dependency either way.

</details>

---

<details open>
<summary><b>🟡 Account & platform gaps (audit 2026-08-02)</b></summary>

Found by auditing for the class of hole that let "forgot your password" ship un-planned:
things a user reasonably expects from an account, and claims made in copy that the code
doesn't back. Ordered by severity.

- [ ] **No email verification.** `emailVerified` column exists and is never written or
  read. Anyone can register with an address they don't control. Decide: verify on
  sign-up, or accept and document why.
- [ ] **No rate limiting on login or registration.** Credential stuffing and brute force
  are unthrottled; the only throttle in the app is the 60-second one on password reset.
  `api/contact` still carries its original "TODO: add rate limiting" comment (honeypot
  is its only defence).
- [ ] **No error boundaries.** No `error.tsx` / `global-error.tsx` anywhere — an
  unhandled render error drops users on Next's default screen, outside the app's design.
- [ ] **No alerting.** Both scheduled jobs and the payment webhook only `console.error`.
  Cheapest fix: have the existing mailer email `founder@` on job/webhook failure.
- [ ] **Data portability is claimed but manual.** Privacy Policy lists the right; there is
  no export endpoint. Handling by hand via the contact route is defensible for a solo
  operator — worth a recorded decision, not urgent.

**Process note:** the old go-live doc grew out of a payments checklist and had no section
for account-level expectations or "does the marketing copy match the code". Treat
`plans.json` and the legal pages as **contracts to audit against the code** before launch.

</details>

---

<details>
<summary><b>🎨 UI / UX — open</b></summary>

- [ ] **Header greeting on mobile.** Rotating signed-in greetings can be long ("The others
  said you wouldn't return, {name}. They were wrong."). Check overflow in the header nav
  on mobile — truncate/ellipsis, wrap, or drop the longest lines from the pool.
- [ ] **Decide on remaining `respond-below(sm)` overrides.** The three desktop-first files
  are converted; what's left are small tweaks inside otherwise mobile-first files
  (`_tarot`, `_main-header`, `_mystic-btn`, `_user-profile`, `_main-footer`, `_main-menu`,
  `_title`, `_reader-selection`) — mobile base, shrink for tiny screens, some documented
  as intentional. Flip to `respond-above` only for strict single-direction consistency.

</details>

---

<details>
<summary><b>🏢 Business & operations (FOP — Individual Entrepreneur)</b></summary>

*(Carried in from the project notes 2026-08-02 — these never lived in the repo.)*

- [ ] Tax-filing reminders — quarterly єдиний податок (single tax) reports.
- [ ] Monthly ЄСВ (unified social contribution) payments.
- [ ] Confirm the Ukrainian data-registry requirement (consult an accountant).
- [ ] Accountant vs self-managed bookkeeping — was flagged for end of Q2; now overdue, decide.

### Security / operational

- [ ] Enable two-factor authentication on: Zoho, Namecheap, Monobank, Termly, Vercel, GitHub.
- [ ] Password manager (1Password / Bitwarden / Apple Keychain).
- [ ] Backups of: eSIM QR/PDF, КЕП (qualified electronic signature), FOP registration
  certificate, Monobank documents.

</details>

---

<details>
<summary><b>🌱 Nice to have — post-launch</b></summary>

Not real work. Consider only after launch, when there's genuinely nothing else on the plate.

- **Currency presentation.** Prices advertised in EUR (€1/€5/€39) but Mono settles in
  UAH (Ukrainian hryvnia) — EU customers see ~254 UAH on statements for €5. (1) Ask Mono
  whether EUR settlement is possible — a bank question, not code; (2) if not, add a
  "charged in UAH at today's rate" disclosure at checkout / on the receipt.
- **"Readings left today" indicator** on the main page; in-app currency / "crystals"
  packs (consume path already decrements a generic balance — a pricing change, not a rebuild).
- **Reconciliation sweep back to hourly.** Currently daily (`0 3 * * *`) because Hobby
  forbids sub-daily jobs — a stuck payment recovers within ~24 h. After the Pro upgrade,
  bump `vercel.json` to hourly (`0 * * * *`) so a lost-webhook payment lands within ~1 h.
- **Social sign-in** (Facebook / Twitter) — the NextAuth `Account` table already exists
  via the Prisma adapter; only the providers need wiring. **Share buttons**
  (Instagram / Pinterest / TikTok / Facebook — priority order for the tarot audience).
- **UX polish (verify still relevant before doing):** move reader selection before the
  deck appears; add a close affordance (✕) to the full-screen card modal; rename
  "Revoke and Retry" → "Draw again".
- **Ads-era compliance — only if/when ads exist:** respect Global Privacy Control
  (the `Sec-GPC: 1` request header) by disabling tracking/ads for users who send it
  (California privacy-law compliance); gate ads to free-tier users only; keep the static
  JSON fallback readings as an opt-out from AI-generated text.
- **Later legal:**
  - EU + UK GDPR Article 27 representatives (required on paper for a non-EU company
    serving EU/UK users; Prighter ~€100/yr, EU-Rep.eu, GDPR-Rep.com; widely ignored by
    small indie founders). Revisit when revenue is meaningful.
  - DMCA designated copyright agent — register with the US Copyright Office (~$6) for
    safe-harbor protection on user uploads. Avatars are live, so user content now exists.
  - Virtual business address in Ukraine (~$30–80/mo) — replaces the home address on the
    public privacy policy.
- **Apple Mail via IMAP** — only if business-email volume picks up; Zoho webmail + the
  phone app are enough for now. Connection details in Key references below.

### Ideas

- Login modal loader — "pulling you into hell" themed entrance animation
- Card flip animation — highlight cards one by one when ready for flipping
- Spooky background sound during the app loading animation
- Footer — animation for highlighted items

</details>

---

<details>
<summary><b>🎯 Future — paid acquisition (Google Ads / paid traffic)</b></summary>

A separate workstream, not near-term. Prerequisites to research and meet first:

- [ ] Google Ads advertiser verification (identity + business).
- [ ] Tarot/divination has specific Google ad-content policies — review whether allowed
  at all, and under what restrictions.
- [ ] Landing page needs clear pricing, refund policy, contact info, Terms + Privacy —
  all of these now exist; keep them visible.
- [ ] Likely cannot claim accuracy or predictive power — the entertainment framing must
  be airtight in ad copy and landing pages.
- [ ] Conversion tracking (Google Analytics or equivalent) installed at that point.
- [ ] Budget plan + acceptable customer-acquisition cost.
- [ ] Other channels (Reddit, TikTok, niche newsletters) have different rules — evaluate
  separately.

</details>

---

<details>
<summary><b>✅ Done — archive (chronological-ish, with the gotchas worth remembering)</b></summary>

### Payments — Plata by mono (JSC Universal Bank, acquiring API v2410) — verified live

- Schema: `add_mono_payment_fields`, `add_pending_plan_and_credits`, `add_payment_ledger`
  (one `Payment` row per invoice, cascade-deletes with the user), `add_renewal_fields` —
  all applied to Neon.
- `POST /api/payments/create-invoice` — auth-gated; records the pending purchase
  (`pendingPlanId`; the tier is NEVER activated before the webhook confirms), tokenizes
  the card for recurring plans, returns Mono's `pageUrl`.
- `POST /api/payments/webhook` — raw-body ECDSA signature verification (cached public
  key, refresh-on-failure); idempotent, order-independent state machine with atomic
  `activatedInvoiceId` compare-and-set and a no-downgrade rule.
- Prices: SINGLE €1 (consumable reading credit, NOT a tier), MONTHLY €5, YEARLY €39 —
  `src/lib/mono.ts`, minor units, currency code 978 (EUR).
- **Verified live on theveil.app:** tokenization 2026-06-30; renewal charge + dunning
  terminal downgrade end-to-end 2026-07-02 (that pass surfaced and fixed a webhook
  concurrency bug — late `processing` delivery clobbering a `success`); credit + tier
  loop 2026-07-13 (anon 1/day → auth wall; FREE 3/day → upsell; €1 credit lands and is
  consumed after the free allotment; MONTHLY/YEARLY unlimited).
- `/payment/result` localized (locale built into Mono's redirect URL) + MysticBackground;
  fuller redesign deferred by choice (2026-07-13).
- **Reconciliation sweep** (2026-07-14): daily job `/api/cron/reconcile` polls Mono for
  `Payment` rows stuck at `created`/`processing` and applies the true status through
  `applyMonoInvoiceStatus` — the same extracted path the webhook uses, so push and poll
  can't drift. `CRON_SECRET`-guarded, like `/api/cron/renew`.
- **Fixes 2026-08-02:**
  - `RENEWAL_LEAD_MS` 24-hour lead window (see Blocking for the live-verify).
  - Lapsed-state display: profile shows "{plan} — expired" + Renew button instead of
    contradicting itself.
  - Reconcile window widened 7 → 90 days AND Mono's `expired` status made terminal
    (clears `pendingPlanId`, no dunning email — the user simply walked away). Live case
    that surfaced it: a €39 invoice from 28 Jun stuck at `created` forever.
  - Premium readers server-side gate (was UI-only; entitlement was derived three
    different ways in three components, two ignoring expiry — all three now read one
    server-computed `isSubscriber`).
- Not live-testable, unit-covered: real card decline / forged `failure` webhook — the
  retry loop + `failure` branch rest on the 12 `decideRenewalAction` tests (36 tests
  pass overall).

### Reading history (built 2026-08-02 — live-verify pending, see Blocking)

- `Reading` model (+ `[userId, createdAt]` index, nullable `title` via
  `add_reading_title`). `POST /api/readings/consume` persists each draw atomically:
  entitlement check → daily-limit count → credit decrement → row write, in one
  interactive transaction under a per-user advisory lock (race-free double-draw
  protection). Anonymous users: nothing persisted.
- `GET /api/readings` cursor-paginated; `/[locale]/history` page (noindex);
  "Ledger of Fates" profile row; empty state offers "Draw Your First Fate"; free users
  see "Begin Initiation" → pricing modal.
- Rename / single delete / purge-all with confirm modals — auth-only endpoints, NOT
  subscriber-gated (a lapsed user must be able to erase their data).
- Print-to-PDF per entry (printer button + `_print.scss`; the browser's "Save as PDF"
  does the conversion — no PDF library).
- `history` translation namespace in all 5 locales, `seo.history`, fully translated.

### Account features

- **Password reset** (2026-08-02, live-verify pending — see Blocking). Routed through the
  shared mailer (`sendPasswordResetEmail`) after a fix: the first version built its own
  transporter and lost the deliverability headers on exactly the message most likely to
  be spam-filtered.
- **Deleted-user eviction** (2026-08-02, live-verify pending — see Blocking).
- **Avatars** — verified on production 2026-08-01. `POST /api/user/avatar`, png/jpg/webp
  ≤2 MB, Vercel Blob, old blob deleted on replace, session propagates without re-login.
  **Gotchas:** a Blob store's public/private access is fixed at creation — the first
  store was private and every upload 500'd; had to recreate as public. Local dev cannot
  upload at all (`BLOB_READ_WRITE_TOKEN` is Sensitive so it can't be pulled; the OIDC
  fallback isn't enabled for the development environment) — test avatar changes on a
  deployment.
- Header slot is auth-dependent: signed-out → language globe; signed-in → avatar circle
  → `/profile`.

### Legal documents (all self-hosted, Termly-free)

- Privacy / Terms / Cookie Policy / Refund Policy live (`src/app/{privacy,terms,cookie-policy,refund}/`),
  all four in the footer. Refund built from Termly's "Return Policy" tile with all
  physical-goods language stripped.
- Legal-name standard everywhere: legal entity **Olena Christensen, Individual
  Entrepreneur (FOP)**; trade name **Nothing Weird**; product **The Veil** ("the Service").
- Hidden Termly DSAR links removed, markup classes stripped, grep-clean.
  Leaked personal phone number removed from the Cookie Policy.
- Cookie consent banner (waits for the intro animation; small centered card).

### Translations — coverage

- 100% key coverage across all locales × namespaces (audited key-by-key 2026-07-14).
  `contact.json` and the delete-account/subscription `ui` block were the gaps; closed.
- Reader feature translations (NO/RU `readers` blocks, reader UI keys, portrait art)
  verified complete 2026-07-14.

### UI (2026-07-05 → 2026-07-13)

- Reader screen: mobile bottom sheet (portaled past the `backdrop-filter`
  containing-block trap), no reflow jump when switching readers, single-column cards
  below `md`. Verified at 360px and 1962px.
- Modal title clears the close button on mobile. Desktop-first files (`_subscription`,
  `_decks`, `_legal-page`) converted to mobile-first. Cookie banner timing + compact
  card. Footer off the reading screen. Cards-screen mobile spacing. Ukrainian title
  overlap fixed. Save button radius.

### Business setup (pre-June)

- Domain `nothingweird.agency` (Namecheap); Zoho Mail Lite with aliases
  hello@ / support@ / billing@ / privacy@ / legal@ → all forward to `founder@`;
  MX, SPF, DKIM, DMARC configured.
- Ukrainian Kyivstar eSIM: **+380 77 659 12 44**.
- FOP registered via Diia, confirmed in the state register; KVEDs (economic activity
  codes) 62.01 primary, 62.02, 62.09, 63.11; single tax 3rd group (5%); Monobank FOP
  account. Mono acquiring token in `.env` + Vercel (`MONO_ACQUIRING_TOKEN`);
  `NEXT_PUBLIC_APP_URL` set for dev/prod.

</details>

---

<details>
<summary><b>📇 Key references</b></summary>

| Item | Value |
|---|---|
| Product / live site | The Veil — theveil.app |
| Legal entity | Olena Christensen, FOP (Individual Entrepreneur), єдиний податок 3rd group (5%) |
| Trade name | Nothing Weird — `nothingweird.agency` |
| KVEDs | 62.01 (primary), 62.02, 62.09, 63.11 |
| Primary email | `founder@nothingweird.agency` (aliases: hello@, support@, billing@, privacy@, legal@) |
| Ukrainian phone | +380 77 659 12 44 (Kyivstar) |
| Bank / acquiring | Monobank FOP account; Plata by mono (JSC Universal Bank) |
| Plans | FREE / SINGLE €1 (credit) / MONTHLY €5 / YEARLY €39 — base currency EUR, settles UAH |
| Email host | Zoho Mail Lite (€11/yr) |
| Domain renewal | `.agency` ~$19/yr at Namecheap |
| Legal docs | Generated on shared Termly Pro+, self-hosted in-repo, Termly-free |
| Hosting | Vercel (Hobby → **Pro required at launch**); DB Neon Postgres |

### Zoho IMAP/SMTP (for Apple Mail or other clients)

- IMAP: `imappro.zoho.eu`, port 993, SSL required
- SMTP: `smtppro.zoho.eu`, port 465 (SSL) or 587 (TLS)
- Username: full address (`founder@nothingweird.agency`); SMTP auth required

</details>

---

## Where the detail lives

- Payment internals, data model, security, design rationale → `docs/features/mono-payments.md`
- Architecture, gotchas, conventions, i18n rules, password-reset design → `CLAUDE.md`
