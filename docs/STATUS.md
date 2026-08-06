# The Veil — Status & Roadmap

**Last updated:** 2026-08-06 · App scope only — umbrella/entity matters stay in the project notes.

<details open>
<summary><b>🟠 Fiscal & legal</b></summary>

- [ ] **PRRO fiscal receipts — waiting on monobank.** Own side done 2026-08-05: trading
  point + register + cashier registered with the tax office, Checkbox connected to the mono
  terminal. Test payment succeeded but mono never sent the fiscalization request (Checkbox
  support confirmed nothing arrives) — ticket open with monobank support, incl. whether
  token-charge renewals fiscalize.
</details>

---

<details open>
<summary><b>🟢 Next after launch — showing ads on The Veil (AdSense)</b></summary>

Second income line next to subscriptions. In order — stop if step 1 fails:

- [ ] **1. Is it even allowed?** Tarot and divination fall under Google's
  restricted-content policies. Confirm the app is eligible, and on what conditions.
- [ ] **2. Is it worth it?** Estimate revenue at current traffic against the design cost.
- [ ] **3. Set up AdSense** — account plus site verification.
- [ ] **4. Place the ad slots** — not in the full-screen card modal, not in the intro
  animation.

Turning ads on triggers two obligations — see **Must-have once triggered**.

</details>

---

<details open>
<summary><b>🔴 Must-have once triggered — becomes mandatory at a threshold</b></summary>

Not blocking launch, but not optional either: each becomes required the moment its
condition is met. The danger is missing the moment — so the trigger is written next to
the task.

- [ ] **European Union "Non-Union One Stop Shop" value-added-tax registration — act when
  the first customer in the European Union pays.** Register then, not before.
- [ ] **Hide ads from paying subscribers — act the day ads go live.** Read `isSubscriber`
  from `GET /api/user/plan`, never re-derive from `planId` — same rule as every other paid
  feature. Without this the "Ad-free" promise on MONTHLY breaks the moment ads appear.
- [ ] **Cookie banner must gate ads — act the day ads go live.** Ads mean tracking, so the
  banner has to block them until the user consents, not just mention them. `Sec-GPC: 1`
  must switch them off for users who send it.
- [ ] **Zoho email cap — act at about 40 daily-card subscribers.** All daily-card emails go
  out through one Zoho mailbox at the same moment. Zoho limits how many emails you can send
  per hour to outside addresses: **somewhere between 50 and 500**, moving up or down with
  your account's sending history. Go over, and the extra emails silently fail (they
  "bounce" — get rejected and returned) — and the app cannot tell, because nothing reads
  the bounce mailbox, so it looks like every email sent fine. **Rule: once roughly 40
  people have the daily-card email switched on, move sending to a bulk service (Resend, or
  Amazon Simple Email Service) before the list grows.** 40 gives a safety margin below
  Zoho's lowest limit of 50/hour, since the app sends the whole batch in one burst. The
  limit is not shown anywhere in the Zoho settings — it lives on this page:
  https://www.zoho.com/mail/help/adminconsole/rates-and-limits.html . Switching sender is
  an afternoon's work and a new small cost line — decide before the list grows, not after.

</details>

---

<details>
<summary><b>🌱 Nice to have — post-launch</b></summary>

Not real work. Consider only after launch, when there's genuinely nothing else on the plate.

- **Translation proofreads** — spreadsheets generated and handed to translators 2026-08-04
  (`translation-review/the-veil-*-proofread.xlsx`); apply corrections as they come back:
  - [ ] Russian
  - [ ] Ukrainian
  - [ ] Turkish
  - [ ] Norwegian
- [ ] **Translate the /cards meanings.** The 78 card meanings in `src/lib/cardMeanings.ts` are
  English only; the routes render in all 5 locales but every non-`en` one is `noindex` and is
  kept out of the sitemap and hreflang set. When a locale's translations land, add it to
  `CARD_CONTENT_LOCALES` in `src/lib/seo.ts` — that one list drives indexing, the sitemap and
  the alternates.
- [ ] **Lawyer review of Terms + Privacy** (~$150–400 in Ukraine; also flag financial-record
  retention law vs the GDPR cascade-delete of `Payment` rows)
- **Get the daily card email into Gmail's Primary tab.** It reliably lands in Promotions,
  while the reading reminder — same sender, domain and DKIM setup — reaches Primary.
  **Do not retry the template.** Layout, subject line and the card image were each tested
  against production on 2026-08-03 and each ruled out (`docs/features/daily-card-email.md`
  §2a); repeating that costs hours and proves nothing. What is genuinely untried:
  confirm SPF/DKIM/DMARC for `nothingweird.agency` in Zoho; ask subscribers to add the
  sender to their contacts when they switch the toggle on; and run one send to a Gmail
  address that has never received these, since the developer's own inbox has filed the
  stream under Promotions often enough that it can no longer measure a change. Accept that
  a recurring automated content email is what Gmail means by a newsletter, and placement is
  per-recipient and learned — it can be influenced, never guaranteed.
- **Currency presentation.** Prices advertised in EUR (€1/€5/€39) but Mono settles in
  UAH (Ukrainian hryvnia) — EU customers see ~254 UAH on statements for €5. (1) Ask Mono
  whether EUR settlement is possible — a bank question, not code; (2) if not, add a
  "charged in UAH at today's rate" disclosure at checkout / on the receipt.
- **In-app currency ("crystals") — replace the €1 single reading.** Sell crystals in bulk
  packs instead of one-off €1 payments; a reading costs N crystals. The consume path
  already decrements a generic balance, so this is mostly a pricing change, not a rebuild.
  Two things to decide first: the pack sizes and the crystals-per-reading rate, and
  **what else crystals buy** — otherwise it is the same product with an extra step.
  Candidates from what already exists: premium readers, seasonal or premium decks,
  long-form interpretations, extra draws past the free daily limit. Caution: a prepaid
  balance is a voucher, so decide what happens to unused crystals on refund and on account
  deletion before selling any.
- **"Readings left today" indicator** on the main page.
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
<summary><b>✅ Done — archive (chronological-ish, with the gotchas worth remembering)</b></summary>

### Database outage, and the silent failure it exposed — 2026-08-06

Neon was unreachable between 02:01 and 03:00 (Coordinated Universal Time). The hourly
reconcile sweep failed at 03:00, 04:00 and 05:00, then recovered on its own. **Email was
not affected** — the daily card went out normally at 02:00.

The outage was not the problem. The three hours of silence were:

- Every cron route reported only at the END of a run — `alertOnJobFailures` and
  `recordHeartbeat` are the last two statements. A run that THREW skipped both, so a crash
  produced a 500 and nothing else. `alertOnJobFailures` fires on errors counted inside the
  loop; a crash never reaches it.
- Heartbeats live in the same database, so a job that cannot connect cannot record that it
  failed either. Both internal safety nets shared the single point of failure they watch.
- UptimeRobot pinged `theveil.app`, which needs no database, so it stayed green throughout.
  The one watcher outside the failure domain was watching the wrong thing.

It surfaced only because the recovered run checks every heartbeat BEFORE stamping its own,
and so reported its own three-hour gap — by design, but three hours late.

Fixed:

- `src/lib/cronJob.ts` — `runCronJob(name, work)` wraps all four routes, catches a throw,
  mails the operator, returns 500. Works during a database outage because `consumeRateLimit`
  already fails open, so the throttle cannot block the one message that matters. Costs one
  email per run while an outage lasts — one an hour for the sweep.
- `src/app/api/health` — `SELECT 1`, no table or migration dependency, 503 when the database
  is down. UptimeRobot now checks it every 30 min, alongside the unchanged 5-min check on
  the home page.
- Reconcile: explicit `maxDuration = 120` and a 90s deadline reporting `remaining: true`, so
  a slow mono can no longer kill the run before its heartbeat.

Root cause of the outage itself: **unknown, and not compute exhaustion** — usage was 5.6 of
100 compute-unit-hours. Neon published no incident. Most likely an unreported wake failure,
the same shape as their 15 July one. Nothing to fix; the point is that next time it takes 30
minutes to hear about it, not three hours.

### Terms §18 vs §19 contradiction — resolved 2026-08-05

§18 gave the courts of Ukraine **exclusive** jurisdiction; §19 sent the same disputes to
binding arbitration (United Nations Commission on International Trade Law rules, seat
Kyiv). Mutually exclusive — two Termly tiles
switched on without noticing they collide. §19's own "Exceptions" block gave it away by
routing disputes back to "the courts listed for jurisdiction above".

**Courts kept, arbitration deleted.** Reasons, in order: a single arbitrator under those
rules costs thousands of euros against a €39 maximum dispute, so it would never have been
invoked; a pre-dispute arbitration clause is unenforceable against European Union
consumers anyway (unfair-terms rules), so it bought nothing; and the class-action
"Restrictions" block was United States boilerplate for a procedure that barely exists here.

Edits to `TermsContent.tsx` — the word "arbitration" now appears zero times in the file:

- **Deleted:** *Binding Arbitration*, *Restrictions*, *Exceptions to Informal Negotiations
  and Arbitration*.
- **Kept:** *Informal Negotiations* (30 days), with "before initiating arbitration" →
  "before starting court proceedings", and its dangling "(except those Disputes expressly
  provided below)" rewritten to name the actual carve-outs, since the block it pointed at
  is gone.
- **Added:** *Court Proceedings* — unresolved Disputes go to the competent courts of
  Ukraine per §18.
- **Added:** *Your Mandatory Rights as a Consumer* — home-country consumer law is not
  overridden; where that law gives the right, the user may sue where they live and we sue
  them only there; urgent injunctive relief and intellectual-property claims may go
  straight to court.

§18 untouched. Note for the lawyer review still on the list: §18's "exclusive" is also
partly unenforceable against European Union consumers for the same reason — the new consumer-rights
paragraph is what acknowledges that rather than pretending otherwise.

### Pricing copy vs code — the honesty audit (2026-08-02, resolved 2026-08-04)

`messages/*/plans.json` is the contract shown on the pricing page and in the in-app
modal; every advertised claim was audited against the code. Outcome: everything
advertised is either built (unlimited readings, history, deck/diviner choice, PDF
export, favourites & notes, daily card email, reminder notifications) or marked
"coming soon" on the card (long-form interpretations, seasonal decks, early access).
The wrong yearly "save 58%" claim was corrected to 35% in all five locales.
The coming-soon marker is `ui.comingSoon` rendered from `Plan.comingSoonFeatures`
(indices, not per-locale text); `plans.test.ts` enforces equal feature counts across
locales and valid marker indices. Audit any new plan copy the same way.
Ad-free stays a live constraint — no tier gating exists, so ads must ship together
with free-tier-only gating (tracked in the AdSense section).

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
  retry loop + `failure` branch rest on the 12 `decideRenewalAction` tests (85 tests
  pass overall, across 11 files).

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

### Hardening pass (2026-08-04) — the platform-gap audit, closed

Every item from the 2026-08-02 audit, plus what each surfaced. Detail lives in `CLAUDE.md`
under the matching heading; this is the index.

- **Rate limiting** — Postgres-backed, two axes (per email, per IP), in front of bcrypt in
  `authorize`; register and contact throttled per IP. Fails open on a DB error. Verified on
  production: attempts 1–10 rejected normally, 11–12 blocked, and the count stopped rising
  while blocked. Vercel Firewall rules added alongside; switched from Log to blocking
  2026-08-05 (zero rule hits in the traffic view — only routine bot scans, all already
  denied/challenged by the firewall's own defaults).
- **Error boundaries** — `[locale]/error.tsx` (themed, translated) and `global-error.tsx`
  (inline-styled, English-only by necessity). Verified against a deliberately thrown error.
- **Alerting** — all four crons and the payment webhook mail the operator on failure,
  throttled to one per hour per key.
- **Dead-man's switch** — jobs stamp a `JobHeartbeat`; the hourly reconcile sweep alerts on
  anything that has gone quiet, checking BEFORE stamping its own so it can report its own
  outage. External layer added 2026-08-05: UptimeRobot (free tier) pings theveil.app every
  5 minutes and emails on downtime.
- **Email verification** — blocks checkout only. Google sign-ins auto-verified.
- **Data portability** — `GET /api/user/export`, credentials excluded and listed in the
  file's own `_omitted` array.
- **Cron paging** — the two email jobs now loop in rounds until the work runs out. The old
  shape mailed the first 200 and returned a cursor **nobody ever called back with**, so
  subscriber 201 onward would never have received anything, on any day, while the logs read
  `sent: 200, failed: 0`.
- **Hardcoded English swept** — register and profile routes return machine codes instead of
  prose (the sign-up form rendered the server's English verbatim), and the three payment
  emails (receipt, dunning, subscription-ended) are localized. Dunning mattered most: it is
  the message telling someone they are about to lose access.

### UI / UX (2026-08-04)

- **Header greeting** — a fixed strip above the header below `md`, wrapping freely. It had
  been ellipsed to a few unreadable words by a `max-width: 45vw` rule written for long
  *names*, applied to whole sentences.
- **Profile rebuilt** — pencils gone, each row's value is its own control; email masked
  behind an eye toggle; the two email preferences became a `Switch` component; "Back to the
  Sanctum" added beside sign-out.
- **Pricing cards** — cancel/resume moved onto the active tier's card; `ui.comingSoon`
  rendered from `Plan.comingSoonFeatures` instead of the phrase being pasted into every
  locale.
- **Deck screen** — gold bead instead of a "SELECTED" pill, previews sized by height (three
  different aspect ratios were guaranteeing three different heights), faint gold card wash
  so each deck's own dark border has something to sit against.
- **Checkboxes styled** — there were no checkbox styles at all; terms, 18+ and remember-me
  were raw system controls on a gold-on-black form.
- **`cursor: not-allowed` removed** from transient disables — it flashed a ban icon on every
  click of a form that was succeeding.
- **SCSS breakpoints** — nine raw `@media` blocks converted to `respond-above`; zero remain
  outside `@media print` and `prefers-reduced-motion`. `.main-menu__welcome` deleted as dead.

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
| Hosting | Vercel **Pro**; uploads Vercel Blob |
| Database | Neon Postgres, **Free plan** — 100 compute-unit-hours/month/project. Compute sleeps after 5 min idle; run out of hours and it stays suspended until the next billing period or an upgrade. |
| Monitoring | UptimeRobot: `theveil.app` every 5 min (no database), `/api/health` every **30 min**. Never put the health check on a short interval while on the Free plan — a check more often than every 5 min never lets the compute sleep and burns ~182 of the 100 hours. |

Entity, banking, domain and email-hosting references are umbrella-level — project notes, not this repo.

</details>

---

## Where the detail lives

- Payment internals, data model, security, design rationale → `docs/features/mono-payments.md`
- Architecture, gotchas, conventions, i18n rules, password-reset design → `CLAUDE.md`
