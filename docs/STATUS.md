# The Veil — Status & Roadmap

**Last updated:** 2026-08-02 · App scope only — umbrella/entity matters stay in the project notes.

<details open>
<summary><b>🔴 Blocking — before taking real money</b></summary>

### Pricing copy vs code — the honesty audit (2026-08-02)

`messages/*/plans.json` is the contract shown on the pricing page and in the in-app
modal. Taking €5/month against unbuilt features is refund and consumer-protection
exposure, not just a product gap. Decision: **build the cheap ones, then re-cut the
list**. Cutting a line = editing five JSON files.

Both cheap ones are done (PDF export, favourites & notes). Since then the daily card email
was built and its cron scheduled (`0 2 * * *` in `vercel.json`), and long-form interpretations were marked
"coming soon" rather than cut. The **yearly "save 58%" claim was wrong** — €5×12 vs €39 is
35%, corrected in all five locales 2026-08-02. What remains needs artwork or a release
pipeline, so the next step is a **build-vs-cut judgement on the three ❌ rows below**.

| Advertised claim | Status |
|---|---|
| Unlimited readings (MONTHLY) | ✅ built |
| Reading history (MONTHLY) | ✅ built — each entry shows date · reader (`Reading.readerId`, recorded 2026-08-02; null on older rows) |
| Choose your deck / your diviner (MONTHLY) | ✅ built |
| Ad-free (MONTHLY) | ⚠️ NOT built — no tier gating exists; only true today because the app has no ads. The day ads are added, subscribers see them too unless free-tier-only gating ships in the same change. |
| Export readings as PDF (MONTHLY) | ✅ built 2026-08-02 — print view per entry, browser "Save as PDF" does the conversion |
| Favorites & personal notes (MONTHLY) | ✅ built 2026-08-02 — star toggle + "favourites only" filter, free-text note per reading (see Reading History in CLAUDE.md) |
| Long-form interpretations (MONTHLY) | ⏳ not built — the pricing copy now says **"(coming soon)"** in all five locales (2026-08-02), so the claim is honest while it waits |
| Daily card email (MONTHLY) | ✅ built 2026-08-02, sending live since 2026-08-03 — opt-in profile toggle, deterministic per-user card, PNG art for Outlook, 78 lines × 5 locales, `/api/cron/daily-card` at `0 2 * * *` (04:00 Kyiv). Day-one fixes: Promotions-tab markup, duplicate sends, attempt-vs-acceptance counting. See `docs/features/daily-card-email.md` |
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
<summary><b>🟠 Fiscal & legal</b></summary>

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
</details>

---

<details open>
<summary><b>🟡 Account & platform gaps (audit 2026-08-02)</b></summary>

Found by auditing for the class of hole that let "forgot your password" ship un-planned:
things a user reasonably expects from an account, and claims made in copy that the code
doesn't back. Ordered by severity.

- [ ] **Zoho's daily send cap is the ceiling on the daily card email.** Every message the
  app sends goes through one Zoho mailbox over SMTP, and Zoho caps messages per day per
  account. The daily card is the first feature that scales with the subscriber count
  rather than with events, so it is the one that will hit that cap first — and silently,
  as bounces. Find the number for the current Zoho plan and write it here. Past it this
  needs a bulk sender (Resend / SES): a different integration and a new cost line, so it
  wants deciding before the list grows, not after.
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
<summary><b>🌱 Nice to have — post-launch</b></summary>

Not real work. Consider only after launch, when there's genuinely nothing else on the plate.

- **Currency presentation.** Prices advertised in EUR (€1/€5/€39) but Mono settles in
  UAH (Ukrainian hryvnia) — EU customers see ~254 UAH on statements for €5. (1) Ask Mono
  whether EUR settlement is possible — a bank question, not code; (2) if not, add a
  "charged in UAH at today's rate" disclosure at checkout / on the receipt.
- **"Readings left today" indicator** on the main page; in-app currency / "crystals"
  packs (consume path already decrements a generic balance — a pricing change, not a rebuild).
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
- **DMCA designated copyright agent** — register with the US Copyright Office (~$6) for
  safe-harbor protection on user uploads. Avatars are live, so user content now exists.

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
- **Reconciliation sweep** (2026-07-14; hourly since 2026-08-02): `/api/cron/reconcile` polls Mono for
  `Payment` rows stuck at `created`/`processing` and applies the true status through
  `applyMonoInvoiceStatus` — the same extracted path the webhook uses, so push and poll
  can't drift. `CRON_SECRET`-guarded, like `/api/cron/renew`.
- **Fixes 2026-08-02:**
  - `RENEWAL_LEAD_MS` 24-hour lead window.
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

### Reading history (built 2026-08-02)

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
- Favourites & notes (`add_reading_note_and_favorite`): star toggle (optimistic, rolls
  back on failure) + server-side `?favorites=1` filter so cursor paging stays correct;
  free-text note (≤2000 chars) shown as a quoted aside and kept on the printed sheet.
  `PATCH /api/readings/[id]` is **partial** — only keys present are written, so the star
  can toggle without clearing a note.
- Provenance (`add_reading_reader`, `add_reading_deck_and_share`): `readerId` + `deckId`
  captured at draw time and validated server-side against the catalogues. Entries show
  `date · reader`, and cards render in the deck actually drawn — not the user's current
  preference. Null on rows written before these migrations; the UI shows nothing rather
  than guessing.
- **Sharing** (`shareId`, nullable + unique): the share button mints an unguessable token
  (9 random bytes, base64url) and publishes the reading at `/{locale}/r/{shareId}` —
  public, no account, **anonymous** (cards, words, reader; never the owner's name),
  `robots: noindex`, with OG/Twitter tags so links unfurl. Minting is idempotent (re-share
  returns the same link, so nobody accumulates forgotten live URLs) and revocable
  (`DELETE` clears `shareId` and the page 404s at once). Share dialog offers copy-link,
  X / Facebook / Telegram / WhatsApp intent URLs (**plain links — no third-party SDKs, so
  no trackers and no cookie-consent implications**) and the native share sheet where the
  browser supports it. The public page ends with a CTA to draw your own.
- **OG image** (`opengraph-image.tsx`): 1200×630 generated per shared reading via `next/og`
  — title, reader, the three cards in the deck they were drawn with, wordmark, on the
  app's dark/gold gradient. Node runtime, since it uses Prisma and `node:fs`. Three
  traps, all found the hard way — full detail in CLAUDE.md → Reading History:
  - **Satori can't decode WebP.** All deck art is `.webp`; handing satori one throws
    `a is not iterable` and kills the whole response. Cards are transcoded to PNG with
    `sharp` (already a direct dependency).
  - **`public/` is not on the serverless filesystem** — it's CDN-served, so card art is
    fetched over HTTP from `NEXT_PUBLIC_APP_URL`, never `readFile`d. Bundling isn't an
    option either: `public/Cards` is 76MB.
  - **A runtime `readFile` is invisible to Next's tracer**, so the font needs an explicit
    `experimental.outputFileTracingIncludes` entry in `next.config.mjs`. Font is committed
    at `assets/fonts/Raleway-Light.ttf` because `next/font/google` only emits hashed woff2
    inside `.next`. The load is guarded — a missing font degrades to the default typeface
    rather than 500ing the preview.
  - Both filesystem traps passed locally and failed only in production. Anything that
    touches disk in a route needs checking against a real deployment, not just dev.
- `history` translation namespace in all 5 locales, `seo.history`, fully translated.

### Account features

- **Password reset** (2026-08-02). Routed through the
  shared mailer (`sendPasswordResetEmail`) after a fix: the first version built its own
  transporter and lost the deliverability headers on exactly the message most likely to
  be spam-filtered.
- **Deleted-user eviction** (2026-08-02).
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

### App infrastructure (pre-June)

- Mono acquiring token in `.env` + Vercel (`MONO_ACQUIRING_TOKEN`);
  `NEXT_PUBLIC_APP_URL` set for dev/prod.
- Contact routing wired to the business aliases (privacy@ / legal@ / billing@ /
  support@) via the `/contact` form. Entity, domain and email setup itself is
  umbrella-level — project notes, not this repo.

</details>

---

<details>
<summary><b>📇 Key references (app scope only)</b></summary>

| Item | Value |
|---|---|
| Product / live site | The Veil — theveil.app |
| Names in legal pages | legal entity **Olena Christensen, FOP**; trade name **Nothing Weird**; product **The Veil** ("the Service") |
| Payment processor | Plata by mono (JSC Universal Bank), acquiring API v2410 |
| Plans | FREE / SINGLE €1 (credit) / MONTHLY €5 / YEARLY €39 — base currency EUR, settles UAH |
| Contact routing | `/contact` form → privacy@ / legal@ / billing@ / support@ `nothingweird.agency` |
| Hosting | Vercel **Pro**; DB Neon Postgres; uploads Vercel Blob |

Entity, banking, domain and email-hosting references are umbrella-level — project notes, not this repo.

</details>

---

## Where the detail lives

- Payment internals, data model, security, design rationale → `docs/features/mono-payments.md`
- Architecture, gotchas, conventions, i18n rules, password-reset design → `CLAUDE.md`
