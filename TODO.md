# TODO

## Translations — pre-launch (BLOCKING)

**Coverage is now 100%** (verified 2026-07-14 via key-by-key audit vs EN — 0 missing, 0 empty, 0 untranslated-English across all 4 locales × 8 namespaces). The two gaps that existed are closed:
- `contact.json` — was 100% English in every locale; now translated in NO/RU/TR/UK.
- `ui` delete-account + subscription-management block (~15 keys) — was English in NO/TR/UK; now translated (RU already had it).
- Remaining EN-identical keys are intentional: brand names (`Rider-Waite`, `Klimt`, `The Veil`), reader proper names, the literal `DELETE` confirm placeholder, the `you@example.com` example.

- [ ] **Native-level QUALITY proofread on non-EN locales.** Coverage is done; this is about *how it reads*, which the audit can't measure:
  - **RU** — quality is rough app-wide. Must stay **formal "вы"** in all UI (`ui.json`), gender-neutral in readings (no gendered past-tense with "ты"), use **"таролог"** (never "гадалка"), brand = **"Завеса"**. Reader voice lines may use "ты" in-character. See CLAUDE.md i18n § for the full rules.
  - **UK** — full read-through for naturalness (brand = **"Завіса"**, reader = **"таролог"**).
  - **TR** — full read-through (machine-assisted translations need a native check).
  - **NO** — light sanity pass.
  - The new `contact` + `ui` strings above were added in this pass and want a native eye like the rest.
  - **Reading-history + password-reset strings (added 2026-08-02).** Unlike the batch below these were written translated, not as English placeholders — the whole `history` namespace (20 keys × 5 locales), 14 password-reset `ui` keys (`forgotPassword*`, `sendResetLink`, `resetLinkSent`, `backToSignIn`, `resetPassword*`, `resetEmail*`), `profileHistory`/`profileHistoryOpen`, and `seo.history`. They still want the same native eye as everything else, especially the reset **email** copy, which is the only user-facing text sent outside the app.
  - **Profile page themed labels (added 2026-07-14) + avatar strings (2026-07-15).** 16 new `ui` keys are **English placeholders in no/ru/uk/tr** — need real translation. Labels: `profileTitle`, `profileName`, `profileEmail`, `profilePlan`, `profileCredits`, `profileDeck`, `profileReader`, `profileLanguage`, `profilePassword`, `profileBreakSeal`, `profileForgeSeal`. Avatar: `profileAvatar`, `profilePictureAria`, `avatarTooLarge`, `avatarBadType`, `avatarUploadFailed`. Voice: mystic/ironic/cult-like, never self-describing. Keep RU formal "вы", UK formal "ви". (All present in the `translation-review/*.csv` sheets, flagged `[TRANSLATE]`.)

## Platform — pre-launch (BLOCKING)

- [ ] **Upgrade Vercel to Pro ($20/mo) before taking real money.** The project runs on the free **Hobby** plan, and Vercel's fair-use guidelines restrict Hobby to **non-commercial, personal use** — selling subscriptions isn't that. This is a terms problem, not a technical one: **renewals work fine on Hobby** (its only limit is one cron run per day, which the 24h `RENEWAL_LEAD_MS` window comfortably covers). Pro also raises runtime-log retention from 1 hour to 1 day, which helps the missing-alerting gap. Not urgent until real customers pay; do it before launch, not after. See `docs/go-live.md` → Blocking.

## Features — pre-launch (BLOCKING)

- [ ] **Reading-history UI — built 2026-08-02, not yet live-verified.** Own page at `/[locale]/history` (`page.tsx` + `HistoryPageClient.tsx` + `src/components/ReadingHistory.tsx`), subscriber-gated. `GET /api/readings` returns the user's readings newest-first, cursor-paginated (`?cursor=&take=`, max 50), 403 `subscription_required` for anyone without an active MONTHLY/YEARLY tier. Entry shows date, card thumbnails in the user's deck + card names, and the reading text. Non-subscribers hitting the URL get the locked panel → pricing modal. Profile has a **Ledger of Fates** row: subscribers navigate to `/history`, everyone else gets `SubscriptionModal`. Gate rule extracted to `isActiveTier()` in `readingAccess.ts` so the API and the reading gate agree. New `history` translation namespace in all 5 locales (registered in `request.ts`) + `seo.history` + 2 `ui` keys — all fully translated, no placeholders. Entries also show the **time**, can be renamed (`PATCH /api/readings/[id]`, nullable `Reading.title`) or deleted (`DELETE /api/readings/[id]`), and the whole ledger can be purged (`DELETE /api/readings`) — both destructive actions confirm in a modal. Those three endpoints are auth-only, not subscriber-gated. The empty ledger offers a **Draw Your First Fate** link back to `/`, and the profile row shows **Begin Initiation** instead of the eye icon for free users. **Remaining:** live-verify as a subscriber (list renders, pagination, rename/delete/purge, 403 path).
- [x] **User avatars** — done. Built 2026-07-15, verified working on production 2026-08-01 after the Blob store was recreated with **public** access (access mode is fixed at store-creation time and cannot be changed afterwards — a private store fails `put({access:"public"})`). Local dev still can't upload: `BLOB_READ_WRITE_TOKEN` is Sensitive so it can't be read back from the dashboard or `vercel env pull`, and the OIDC fallback errors with "OIDC is enabled for this project, but not for the development environment". Production is unaffected.

- [x] **Password reset ("forgot your password")** — built 2026-08-02, **not yet round-tripped live**. Link in the login modal → `POST /api/auth/forgot-password` → localized email → `/[locale]/reset-password?token=…` → `POST /api/auth/reset-password` → auto sign-in. SHA-256-hashed single-use tokens (`PasswordResetToken`, migration `add_password_reset_token`), 1-hour TTL, 60s per-account throttle, enumeration-safe responses. Design in CLAUDE.md → Password Reset. **Remaining:** send a real email and redeem a real token.
- [x] **Out-of-band deleted users stay logged in** — fixed 2026-08-02. JWT sessions never read the DB; the `jwt` callback now re-checks the user row every 5 min and throws when it's gone. **Remaining:** confirm live (delete a test user, wait 5 min, hit any page).

## UX / polish — pre-launch

- [ ] **Header greeting — mobile version.** The rotating signed-in greetings (`messages/*/greetings.json`, resolved in `MainMenu.tsx`) can be long (e.g. "The others said you wouldn't return, {name}. They were wrong."). Check the header nav link on mobile and handle overflow — truncate/ellipsis, wrap, or drop the longest lines from the pool.

## Reader feature — follow-ups

_Reader translations verified complete 2026-07-14: NO/RU `readers` blocks, all reader UI keys, and portrait art are all done._

## Payments — open tasks

Payment backend, frontend, credit/tier loop, and recurring renewal are **built and verified** — full status in `docs/go-live.md`. Only open work below.

- [x] **Live-verify the credit + tier loop on prod** — done 2026-07-13: anon 1 → auth wall; FREE 3 → upsell; €1 SINGLE credit lands + consumes after free allotment; MONTHLY/YEARLY unlimited.
- [x] **Redesign `/payment/result`** — deferred/closed 2026-07-13. Good enough for now: localized + `<MysticBackground />` added. Revisit only if a fuller branded treatment is wanted later. Styles: `_payment-result.scss`.
- [x] **Localize `/payment/result`** — done 2026-07-13. `create-invoice` now builds `redirectUrl = /{locale}/payment/result` (client sends its locale), so Mono lands users on the localized page under `[locale]/payment/result`. New `payment` namespace in all 5 locales (`messages/*/payment.json`, registered in `request.ts`). Unprefixed `/payment/result` kept as a fallback that redirects to the default locale. (Chose locale-in-redirectUrl over the earlier cookie-hop plan — simpler, locale can't get lost.)
- [x] **Reconciliation sweep** — built 2026-07-14. Daily cron `/api/cron/reconcile` polls Mono for the true status of any `Payment` row stuck at `created`/`processing` for 30 min–7 days and applies it via the shared `applyMonoInvoiceStatus` (extracted from the webhook, so push + poll go through one idempotent path). Bearer-auth via `CRON_SECRET`; registered in `vercel.json` (`0 3 * * *` — daily, since the Vercel Hobby plan forbids sub-daily crons). New Mono helper `getInvoiceStatus`.

_Not live-testable (unit-test covered): real card decline + forged `failure` webhook — retry loop + webhook `failure` branch rely on the 12 `decideRenewalAction` tests._
