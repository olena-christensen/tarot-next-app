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

## UX / polish — pre-launch

_(none open)_

## Reader feature — follow-ups

_Reader translations verified complete 2026-07-14: NO/RU `readers` blocks, all reader UI keys, and portrait art are all done._

## Payments — open tasks

Payment backend, frontend, credit/tier loop, and recurring renewal are **built and verified** — full status in `docs/go-live.md`. Only open work below.

- [x] **Live-verify the credit + tier loop on prod** — done 2026-07-13: anon 1 → auth wall; FREE 3 → upsell; €1 SINGLE credit lands + consumes after free allotment; MONTHLY/YEARLY unlimited.
- [x] **Redesign `/payment/result`** — deferred/closed 2026-07-13. Good enough for now: localized + `<MysticBackground />` added. Revisit only if a fuller branded treatment is wanted later. Styles: `_payment-result.scss`.
- [x] **Localize `/payment/result`** — done 2026-07-13. `create-invoice` now builds `redirectUrl = /{locale}/payment/result` (client sends its locale), so Mono lands users on the localized page under `[locale]/payment/result`. New `payment` namespace in all 5 locales (`messages/*/payment.json`, registered in `request.ts`). Unprefixed `/payment/result` kept as a fallback that redirects to the default locale. (Chose locale-in-redirectUrl over the earlier cookie-hop plan — simpler, locale can't get lost.)
- [x] **Reconciliation sweep** — built 2026-07-14. Daily cron `/api/cron/reconcile` polls Mono for the true status of any `Payment` row stuck at `created`/`processing` for 30 min–7 days and applies it via the shared `applyMonoInvoiceStatus` (extracted from the webhook, so push + poll go through one idempotent path). Bearer-auth via `CRON_SECRET`; registered in `vercel.json` (`0 3 * * *` — daily, since the Vercel Hobby plan forbids sub-daily crons). New Mono helper `getInvoiceStatus`.

_Not live-testable (unit-test covered): real card decline + forged `failure` webhook — retry loop + webhook `failure` branch rely on the 12 `decideRenewalAction` tests._
