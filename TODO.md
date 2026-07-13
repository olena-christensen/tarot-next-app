# TODO

## UX / polish — pre-launch

_(none open)_

## Nice to have when we have time to do it

- **Currency presentation.** We advertise prices in EUR (€1/€5/€39), but monobank settles in UAH, so EU customers see the converted hryvnia amount (~254 UAH for €5) on their statements, not euros. Two parts: (1) ask Mono whether EUR settlement is possible — a bank/account question, not code; (2) if not, add a small "charged in UAH at today's rate" disclosure at checkout / on the receipt. Not a launch blocker.

## Ideas

- Login modal loader — "pulling you into hell" themed entrance animation
- Card flip animation — highlight cards one by one when ready for flipping
- Spooky background sound during app loading animation
- Footer — animation for highlighted items
- User profile page

## Reader feature — follow-ups

- Translate `readers` block in `messages/no/readings.json` and `messages/ru/readings.json` (Vespera / Crow / Reginald: displayName, title, tagline, bio, intros, bridges, futureBridges, closings, prefixes). Until then, NO/RU users see hardcoded defaults on the main page and the "Change your reader" button is hidden.
- Translate reader-related UI keys in `messages/no/ui.json` and `messages/ru/ui.json`: `chooseYourReader`, `readerSelectionSubtitle`, `hoverToLearn`, `summonReader` (has `{name}` placeholder), `yourReaderIs`, `changeYourReader`, `upgradeToUnlock`.
- Add reader portrait art at `public/readers/{vespera,crow,reginald}.webp` and swap the placeholder initial in `ReaderSelection.tsx` and `OfferBlock.tsx` for `<Image>`.
- UI polish: fix layout/styling issues with reader presentation on main page (positioning within offer-block, animation timing, responsive behavior).
- Persist reader preference to DB (similar to `preferredDeck` pattern) — currently session-scoped only.

## Payments — open tasks

Payment backend, frontend, credit/tier loop, and recurring renewal are **built and verified** — full status in `docs/go-live.md`. Only open work below.

- [x] **Live-verify the credit + tier loop on prod** — done 2026-07-13: anon 1 → auth wall; FREE 3 → upsell; €1 SINGLE credit lands + consumes after free allotment; MONTHLY/YEARLY unlimited.
- [ ] **Vercel prod env:** confirm `GOOGLE_CLIENT_SECRET` (new value) and `NEXT_PUBLIC_APP_URL=https://theveil.app`.
- [x] **Redesign `/payment/result`** — deferred/closed 2026-07-13. Good enough for now: localized + `<MysticBackground />` added. Revisit only if a fuller branded treatment is wanted later. Styles: `_payment-result.scss`.
- [x] **Localize `/payment/result`** — done 2026-07-13. `create-invoice` now builds `redirectUrl = /{locale}/payment/result` (client sends its locale), so Mono lands users on the localized page under `[locale]/payment/result`. New `payment` namespace in all 5 locales (`messages/*/payment.json`, registered in `request.ts`). Unprefixed `/payment/result` kept as a fallback that redirects to the default locale. (Chose locale-in-redirectUrl over the earlier cookie-hop plan — simpler, locale can't get lost.)
- [ ] (Deferred) "readings left today" indicator on the main page; in-app currency / "crystals" packs (consume path already decrements a generic balance — a pricing change, not a rebuild).
- [x] **Reconciliation sweep** — built 2026-07-14. Hourly cron `/api/cron/reconcile` polls Mono for the true status of any `Payment` row stuck at `created`/`processing` for 30 min–7 days and applies it via the shared `applyMonoInvoiceStatus` (extracted from the webhook, so push + poll go through one idempotent path). Bearer-auth via `CRON_SECRET`; registered in `vercel.json` (`0 * * * *`). New Mono helper `getInvoiceStatus`.

_Not live-testable (unit-test covered): real card decline + forged `failure` webhook — retry loop + webhook `failure` branch rely on the 12 `decideRenewalAction` tests._
