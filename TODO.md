# TODO

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

## Payments — follow-ups

- Localize the `/payment/result` page. It ships English-only because it is a top-level route (`src/app/payment/result/page.tsx`) outside the `[locale]` tree — Mono's `redirectUrl` carries no locale segment — so next-intl request-locale scoping does not reach it. Plan:
  - Before redirecting to Mono in `SubscriptionPlans.tsx`, set a short-lived cookie (e.g. `payment_locale`) with the current locale, since the redirect back cannot carry it.
  - Turn the top-level `/payment/result` into a thin server component that reads that cookie and redirects to `/[locale]/payment/result`, which lives inside the locale tree and gets proper scoping.
  - Build the real localized result page under `[locale]/payment/result` and add its strings to the message files for all five locales (English, Norwegian, Russian, Turkish, Ukrainian) — the keys are new and exist in none of them yet.
