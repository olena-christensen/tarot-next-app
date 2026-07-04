# TODO

## 🔴 Priority — pre-launch (blocks everything else)

- [ ] **Mobile version is broken across the board.** Every page / screen / layout is fucked on mobile — needs a full responsive pass. FIX THIS BEFORE ANYTHING ELSE.

## UX / polish — pre-launch

- [ ] **Intro/smoke animation replays on every return to the main page.** After a reading, "Back to the Sanctum" (and any redirect to `/`) replays the whole intro (moon/smoke/etc.) every single time — feels wrong. Should play **once per session**, not on every client-nav back. The skip-intro pattern (module-level `hasPlayedIntro` flag + `skip-intro` class) already distinguishes refresh from client-nav; extend it so post-reading returns / redirects to `/` skip the intro too. Confirmed live 2026-07-02 during the €1 purchase flow.
- [ ] **Price / subscription modal — UI redesign.** User doesn't like the current look. The in-app modal now exists as `SubscriptionModal` (wraps `SubscriptionPlans`, opened from the home reading-gate and the profile's Current-plan / Reading-Credits / reader-upgrade actions); this item is about the *visual* redesign of `SubscriptionPlans` / `_subscription.scss`.
- [ ] **Anon paywall — in-character message before the auth modal.** When an anonymous user spends their 1 free reading and tries for more, don't slam the login modal in their face — show a themed, in-app-voice message first ("you want more… you'll need to sacrifice something…" vibe) that then leads into signup.
- [ ] **Reader modal UI — rethink the "Summon" button.** Now that clicking a reader card chooses that reader in place (glow + bead move, saved) without closing, the persistent "Summon [Name]" button is confusing — it reads as "start the reading" but really just closes the modal / confirms. Redesign the interaction so choose vs. confirm/close is clear (e.g. card-click = choose, and a clearer "Done"/"Confirm" affordance, or drop the button and close on an explicit confirm). Applies to both the profile modal and the main-page "Change your reader" modal (`ReaderSelection.tsx`).

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

- [ ] **Live-verify the credit + tier loop on prod:** anon 1 → auth wall; FREE 3 → upsell; buy €1 SINGLE → 4th reading consumes the credit (UserProfile balance decrements); MONTHLY/YEARLY unlimited.
- [ ] **Vercel prod env:** confirm `GOOGLE_CLIENT_SECRET` (new value) and `NEXT_PUBLIC_APP_URL=https://theveil.app`.
- [ ] **Decide currency presentation.** Mono settles in UAH (€5 → ~254 UAH at Mono FX); EU cards show UAH on statements. Confirm with Mono whether EUR settlement is possible; decide receipt wording. Not a launch blocker.
- [ ] **Redesign `/payment/result`.** Bare spinner + heading + text → branded design across all states (confirming / tier-active / credit-added / failed / still-processing). Styles: `_payment-result.scss`.
- [ ] **Localize `/payment/result`.** English-only: top-level route outside `[locale]`, Mono's redirect carries no locale. Plan: set a short-lived `payment_locale` cookie before redirecting to Mono → top-level route becomes a thin server component that reads it and redirects to `/[locale]/payment/result` → build the localized page + add strings to all 5 locales.
- [ ] (Deferred) "readings left today" indicator on the main page; in-app currency / "crystals" packs (consume path already decrements a generic balance — a pricing change, not a rebuild).
- [ ] (Not blocking) Reconciliation sweep for a charge stuck at `paymentStatus="created"` if Mono never sends a terminal webhook. Exclude healthy subs; note `downgradeToFree` leaves stale `expiresAt`/`monoCardToken` on the FREE row.

_Not live-testable (unit-test covered): real card decline + forged `failure` webhook — retry loop + webhook `failure` branch rely on the 12 `decideRenewalAction` tests._
