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

### Core monetization loop — BUILT (2026-06-30, uncommitted; subagent-driven, per-task + whole-branch review READY-TO-MERGE)
Spec: `docs/superpowers/specs/2026-06-29-free-tier-limit-and-credit-consumption-design.md`; plan: `docs/superpowers/plans/2026-06-29-free-tier-limit-and-credit-consumption.md`.
- [x] Reading flow **consumes `readingCredits`** — atomic compare-and-set decrement in `POST /api/readings/consume`, only after the daily free allotment is exhausted.
- [x] **Free-tier daily limit** — anonymous **1/day** (soft localStorage counter, `src/lib/anonReadingLimit.ts`), logged-in FREE **3/day** (server-counted via today's `Reading` rows, UTC reset). Pure decision in `src/lib/readingAccess.ts`; orchestrated by `src/hooks/useReadingGate.ts` (gates BOTH deck click and "Unveil Another Fate"). Blocked anon → login modal; blocked FREE → subscription modal (reused surfaces).
- [x] Gating: FREE + `readingCredits > 0` gets an extra reading; MONTHLY/YEARLY bypass entirely. Server-authoritative; fail-open on transient error by design.
- [x] **Credit balance** surfaced in UserProfile (`credits` key in all 5 locales).
- [x] `Reading` table now written per reading (index `@@index([userId, createdAt])`, migration `20260629213405_add_reading_user_createdat_index`) — also enables future reading-history UI.

#### Follow-ups (NOT blockers — from final review)
- [x] `$transaction`-wrap the `consume` path — DONE 2026-06-30. count→decide→commit in one interactive `prisma.$transaction` opened with a per-user `pg_advisory_xact_lock` (xact-scoped, correct for Neon's pooler): closes the free-tier count→create TOCTOU AND makes credit decrement+reading-write atomic (a write failure rolls back the credit). Focused Opus review approved, 0 Critical/Important.
- [x] Disable "Unveil Another Fate" during the in-flight consume fetch — DONE 2026-06-30. `useReadingGate` now sets `isResponseLoading: true` at the start of a draw and clears it on commit/block, so the existing `disabled={state.isResponseLoading}` guard (`Tarot.tsx:140`) is live again; a fast double-click can't fire two draws.
- [x] Drop the now-orphaned `shakeCount` state — DONE 2026-06-30. Removed from `AppState` type, both default objects, and the hook's commit.
- [ ] (Deferred from spec) "readings left today" indicator on the main page; in-app currency / "crystals" packs (the consume path already decrements a generic balance, so it's a pricing change, not a rebuild).

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
