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
  - **Profile page themed labels (added 2026-07-14) + avatar strings (2026-07-15).** 16 new `ui` keys are **English placeholders in no/ru/uk/tr** — need real translation. Labels: `profileTitle`, `profileName`, `profileEmail`, `profilePlan`, `profileCredits`, `profileDeck`, `profileReader`, `profileLanguage`, `profilePassword`, `profileBreakSeal`, `profileForgeSeal`. Avatar: `profileAvatar`, `profilePictureAria`, `avatarTooLarge`, `avatarBadType`, `avatarUploadFailed`. Voice: mystic/ironic/cult-like, never self-describing. Keep RU formal "вы", UK formal "ви". (All present in the `translation-review/*.csv` sheets, flagged `[TRANSLATE]`.)

## Features — pre-launch (BLOCKING)

- [ ] **Reading-history UI — advertised but not surfaced.** MONTHLY plan lists "Reading history" (`messages/en/plans.json`); Privacy Policy + delete-account warning promise it — but there's no view. Backend already persists every reading (`Reading` model in `schema.prisma`; row created in `/api/readings/consume`). Need a `GET /api/readings` endpoint + a subscriber-gated history view (route or profile section). **Decision (2026-07-14): build it before launch.** (Pulling the plan-copy claim is only a last-resort fallback if it can't ship in time.) See `docs/go-live.md` → Blocking.
- [ ] **User avatars — built 2026-07-15, blocked on Blob store.** Upload built profile-only: reuses the existing `User.image` field (no migration), `POST /api/user/avatar` uploads to Vercel Blob (png/jpg/webp, ≤2MB, deletes old blob on replace) and saves the URL; `auth.ts` propagates `image` through `update()`; UserProfile shows an avatar circle + upload pencil. **Remaining:** create a Vercel Blob store (dashboard → Storage) so `BLOB_READ_WRITE_TOKEN` is provisioned, add it to `.env` for dev, then live-verify upload → display. Not testable until the token exists. See `docs/go-live.md` → Blocking.

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
