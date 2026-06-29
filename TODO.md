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

**Status (2026-06-29):** Payment frontend DONE + verified on production. **Recurring-renewal
engine now BUILT** (branch `feature/mono-payments`, uncommitted) — daily cron + dunning state
machine + token charge + renewal-aware webhook + cancel/resume + emails; built subagent-driven,
per-task + whole-branch review clean. Plan: `docs/superpowers/plans/2026-06-29-recurring-renewal.md`.
It is code-complete but **unverifiable live until tokenization is re-confirmed (≈2026-06-30)** with
a real MONTHLY/YEARLY payment storing a non-null `monoCardToken`. Full launch status lives in
`docs/go-live.md` (source of truth); items below are the remaining dev work.

### Next — core monetization loop (makes payments actually mean something)
- [ ] Reading flow **consumes `readingCredits`** — a purchased SINGLE credit is stored but never spent today, so a €1 purchase currently grants nothing usable.
- [ ] **Free-tier daily limit** enforcement (e.g. count 3 readings/day) — without it there is no enforced reason to pay.
- [ ] Free-tier gating treats a FREE user with `readingCredits > 0` as allowed an extra reading; MONTHLY/YEARLY bypass the limit entirely.
- [ ] Surface the **credit balance** in the persistent UI (UserProfile shows the plan but not credits; `GET /api/user/plan` already returns `readingCredits`).

### Recurring renewal — remaining to ship (engine is built)
- [x] **Contact Mono support to enable tokenization** ("робота з токенами") — Mono enabled it 2026-06-28, live ≈2026-06-30.
- [ ] **Re-confirm tokenization** with a real MONTHLY/YEARLY payment → `monoCardToken` non-null. HARD PREREQUISITE for the renewal e2e.
- [ ] Set `CRON_SECRET` locally (`.env`/`.env.local`) and in Vercel (Sensitive); deploy so `vercel.json`'s daily cron is active.
- [ ] Local cron smoke test, then live e2e (charge → webhook → period extend → receipt; decline → dunning → retry → downgrade).
- [ ] Follow-up (not blocking): reconciliation sweep for a charge stuck at `paymentStatus="created"` if Mono never sends a terminal webhook.

### Business / ops (not code)
- [ ] Update prod env in Vercel if not already done: `GOOGLE_CLIENT_SECRET` (new value) + confirm `NEXT_PUBLIC_APP_URL=https://theveil.app`.

### Polish
- [ ] Redesign the `/payment/result` page. The current page is functional but visually bare (plain spinner + heading + text); it needs a proper branded design that matches The Veil aesthetic across all states (confirming / tier-active / credit-added / failed / still-processing). Styles live in `src/assets/scss/blocks/_payment-result.scss`.
- [ ] Localize the `/payment/result` page. It ships English-only because it is a top-level route (`src/app/payment/result/page.tsx`) outside the `[locale]` tree — Mono's `redirectUrl` carries no locale segment — so next-intl request-locale scoping does not reach it. Plan:
  - Before redirecting to Mono in `SubscriptionPlans.tsx`, set a short-lived cookie (e.g. `payment_locale`) with the current locale, since the redirect back cannot carry it.
  - Turn the top-level `/payment/result` into a thin server component that reads that cookie and redirects to `/[locale]/payment/result`, which lives inside the locale tree and gets proper scoping.
  - Build the real localized result page under `[locale]/payment/result` and add its strings to the message files for all five locales (English, Norwegian, Russian, Turkish, Ukrainian) — the keys are new and exist in none of them yet.
