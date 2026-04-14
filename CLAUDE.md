# Project: Tarot Next App

## Infrastructure

- **Hosting:** Vercel (paid plan)
- **Database:** PostgreSQL via Prisma (Vercel Postgres / Prisma Data Platform)
- **Prisma version:** v6 — DO NOT UPGRADE
- **Auth:** NextAuth v4 with Prisma adapter
- **Framework:** Next.js 14, App Router, React 18, TypeScript
- **Styling:** SCSS (`src/assets/scss/`), CSS custom properties (two-layer system in `_variables.scss`)

## Rules

### Before upgrading ANY dependency:
1. State clearly what version is currently installed and what version you want to install
2. List every breaking change between those versions
3. Estimate how much work the upgrade will require
4. **ASK FOR PERMISSION before proceeding**
5. If the user says no, do not upgrade

### When installing new packages:
- Pin to the major version that matches existing dependencies (e.g., `prisma@6` not `prisma@latest`)
- Never install `@latest` for infrastructure packages without explicit approval

### General:
- DO NOT revert or undo changes without asking
- Keep it direct — just do the work, don't over-explain
- The database and Vercel setup took significant effort — do not break or replace it
- **NEVER run git add, git commit, git stage, or any git write operation** — the user handles all git operations in WebStorm. Subagents must NOT touch git either. Read-only git commands (status, log, diff) are fine.
- **ALWAYS use Opus model** — never use Sonnet, Haiku, or any other model for subagents or any task

## Commands

```bash
npm run dev    # Next dev server (localhost:3000)
npm run build  # Runs `prisma generate` then `next build`
npm run start  # Production server
npm run lint   # next lint
npx prisma migrate dev    # Apply schema changes locally
npx prisma studio         # Inspect DB
```

## Project Structure

```
src/
  app/
    layout.tsx         # Thin root layout (styles + metadata only)
    api/               # Route handlers: auth/, user/, ask/
    [locale]/
      layout.tsx       # Locale-aware layout (NextIntlClientProvider, font)
      page.tsx         # Main tarot page
      decks/           # Deck selection page
      subscription/    # Pricing page
      terms/           # Terms of Service (page.tsx + TermsContent.tsx)
      privacy/         # Privacy Policy (page.tsx + PrivacyContent.tsx)
  i18n/
    routing.ts         # Locale list + default locale
    request.ts         # Message loading per locale
    navigation.ts      # Locale-aware Link, useRouter, usePathname
  middleware.ts        # next-intl locale detection + routing
  components/          # AnimatedCard, Tarot, Login, LoginForm, Modal,
                       # UserProfile, MainMenu, Header, Footer,
                       # PageShell, LanguageSwitcher, DeckSelector,
                       # ReaderSelection, etc.
  lib/
    auth.ts            # NextAuth config (Credentials + Google)
    prisma.ts          # Prisma client singleton
    decks.ts           # Deck catalog (DECKS, DeckId, getCardImagePath)
    readers.ts         # Reader catalog (READERS, ReaderId, DEFAULT_READER)
    plans.ts           # Plan config (id, price, interval — no text)
    subscription.ts    # getUserPlan helper
    generateReading.ts # Reading generation from translated messages (reader-aware)
  generated/prisma/    # Prisma client output (custom location)
  assets/scss/         # All styles
  data.ts              # Card data (id, image, value — no names; paths are deck-relative)
  AppProvider.tsx       # App state + deck-aware card image resolution
messages/
  en/                  # English translations (source of truth)
  no/                  # Norwegian translations
  ru/                  # Russian translations
```

## Environment Variables

Required (see `.env.example`):
- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Internationalization (i18n)

- **Library:** `next-intl` v3 (pinned for Next.js 14 compatibility)
- **Supported locales:** `en` (default), `no` (Norwegian), `ru` (Russian)
- **Routing:** URL prefix-based (`/en/`, `/no/`, `/ru/`). Middleware auto-detects from browser `Accept-Language`, user can override via header dropdown.
- **Translation files:** `messages/{locale}/` with 5 JSON files per locale:
  - `ui.json` — UI strings (buttons, labels, headings, errors)
  - `cards.json` — 78 card names
  - `readings.json` — 78 card readings + reading templates + per-reader voice blocks
  - `plans.json` — plan names and feature lists
  - `legal.json` — Terms of Service + Privacy Policy
- **Config files:** `src/i18n/routing.ts` (locales), `src/i18n/request.ts` (message loading), `src/i18n/navigation.ts` (locale-aware Link/useRouter)
- **Adding a new language:** Create a new folder under `messages/` with all 5 JSON files (same structure as `en/`), then add the locale code to `src/i18n/routing.ts`.
- **Links:** Use `Link` from `@/i18n/navigation` instead of `next/link` in components — this auto-prefixes the locale.
- **Translations in components:** Use `useTranslations("namespace")` hook. Namespaces match the top-level key in each JSON file (`ui`, `cards`, `readings`, `plans`, `legal`).
- **Card names and readings** are no longer in TypeScript files — they live in `messages/{locale}/cards.json` and `readings.json`.
- **Plan names and features** are no longer in `plans.ts` — they live in `messages/{locale}/plans.json`. `plans.ts` only keeps `id`, `priceLabel`, `interval`.
- **Reading generation:** `src/lib/generateReading.ts` takes translated messages, card IDs, and an optional `readerId` to produce locale-aware readings in the chosen reader's voice. Falls back to `readingTemplates` when no reader block exists.
- **Russian translations are gender-neutral.** Russian past-tense verbs require gender agreement, so all `ru` reading texts avoid gendered verb forms with "ты" — using present tense, impersonal constructions, infinitives, and passive/reflexive forms instead. Preserve this when editing `messages/ru/readings.json`.

## CSS Variables

All colors, typography, and border values are defined as CSS custom properties in `src/assets/scss/_variables.scss` using a two-layer system:

- **Palette layer:** Raw color values (`--gold`, `--primary`, `--dark`, `--black`, `--brown`, `--grey`, `--grey-dark`, `--red`, `--green`).
- **Semantic layer:** Usage-specific variables that reference the palette (`--text-color`, `--bg`, `--border-color`, `--input-bg`, `--overlay`, `--scrollbar-thumb`, `--medallion-fill`, `--error`, `--success`, `--font-family`, `--font-weight`, `--border-radius`, `--border`).

**There are NO SCSS variables for colors/typography/borders.** Everything uses `var(--xxx)` directly. The only SCSS variables that exist are mixin parameters.

- **Never hardcode color values** in SCSS files — always use the CSS custom properties.
- **Never introduce new colors** without explicit approval. Use existing palette variables.
- When you need an opacity variant of a palette color, use `rgba(250, 225, 163, 0.XX)` with the raw values (CSS `var()` can't be decomposed inside `rgba()`).

## Gotchas

- **Prisma schema lives at `src/generated/prisma/schema.prisma`**, not the conventional `prisma/` directory. This is set via the `prisma.schema` field in `package.json`. Don't move it.
- `prisma generate` runs as part of `build` — required for Vercel deploys.
- Prisma client is imported via `src/lib/prisma.ts` singleton — use that, don't instantiate `PrismaClient` elsewhere.
- NextAuth is **v4** (not v5/Auth.js). API routes use the `[...nextauth]/route.ts` pattern.
- The Vercel Postgres product was discontinued; the DB is now provisioned through the Vercel Marketplace (Neon). Treat it as plain Postgres via `DATABASE_URL`.
- **All pages live under `src/app/[locale]/`** — not directly under `src/app/`. API routes stay at `src/app/api/` (no locale prefix).
- **`next-intl` v3 uses `unstable_setRequestLocale`** — not `setRequestLocale` (that's v4). Don't upgrade without checking the migration guide.
- **`params` is a direct object in Next.js 14** — not a Promise. Don't add `await params` (that's Next.js 16+).
- **Translation JSON files use namespaced top-level keys** (e.g., `{"ui": {...}}`). The namespace must match what `useTranslations("ui")` expects.
- **Migration history was baselined on 2026-04-07.** Earlier tables (Account, Session, User, etc.) were originally created via `db push`, so a baseline migration `20240101000000_baseline` plus markers for `add_user_created_at` and `add_terms_accepted_at` were added retroactively and `migrate resolve --applied` was used to record them. From here on, use `prisma migrate dev` for all schema changes.

## Subscription / Pricing

- Plan catalog is **static config** in `src/lib/plans.ts` (`PLANS`, `PLAN_ORDER`, `PlanId` type). Edit copy here, no migration needed.
- DB only tracks **which plan a user is on** via the `Subscription` table (`userId @unique`, `planId` enum, `expiresAt`). Absence of a row = `FREE`.
- Read current plan with `getUserPlan(userId)` from `src/lib/subscription.ts` — never query `prisma.subscription` directly from UI code.
- Client-side: fetch `GET /api/user/plan` (mirrors the `password-status` pattern).
- Pricing page lives at `/subscription`, rendered by `src/components/SubscriptionPlans.tsx` (4-column classic layout). Styles: `src/assets/scss/blocks/_subscription.scss`.
- **Payments are not wired yet.** All upgrade CTAs are disabled with tooltip "Payments launching soon". When integrating a payment provider, the `Subscription` row should be created/updated server-side after a successful checkout — `expiresAt` exists for that purpose.
- Out of scope until separate specs land: free-tier enforcement (counting 3 readings/day), reading history UI.

## Deck Selection

- **Available decks:** Rider-Waite (default), Klimt, Gothic-Vintage. Card images live under `public/Cards/{deckName}/` with identical folder structures and filenames across all decks.
- Deck catalog is **static config** in `src/lib/decks.ts` (`DECKS`, `DECK_IDS`, `DeckId` type, `DEFAULT_DECK`). Display names live in translation files (`ui.json`), not here.
- `getCardImagePath(deck, cardImage)` helper prepends `/Cards/{deck}` to a deck-relative path.
- DB stores preference via `preferredDeck` field on the `User` model (`String @default("Rider-Waite")`). No enum — adding a new deck requires no migration.
- **Card image paths in `data.ts` are deck-relative** (e.g. `/MajorArcana/fool.webp`, not `/Cards/Rider-Waite/MajorArcana/fool.webp`). `AppProvider` resolves them at render time using the user's deck preference from their session.
- `preferredDeck` flows through NextAuth: stored in JWT token, exposed via `session.user.preferredDeck`, updatable via `session.update({ preferredDeck })`.
- Client-side: fetch `GET /api/user/deck`, update via `PATCH /api/user/deck`.
- Deck selection page lives at `/decks`, rendered by `src/components/DeckSelector.tsx` (3-column card grid). Styles: `src/assets/scss/blocks/_decks.scss`.
- UserProfile shows current deck name with a link to `/decks` (same pattern as plan/upgrade link).
- **Only logged-in users can select a deck.** Anonymous users see the page but cannot select. Future: restrict to paid subscribers.
- **Mystical-SVG deck is excluded** — exists in `public/Cards/` but not in the catalog.
- **Adding a new deck:** Add card images to `public/Cards/{NewDeck}/` (same folder structure/filenames as Rider-Waite), add an entry to `DECKS` in `src/lib/decks.ts`, add a `deck{Name}` translation key to all `ui.json` files, and update `DECK_NAME_KEYS` in `DeckSelector.tsx`.

## Reader Selection

- **Available readers:** Madame Vespera (default), The Crow, Reginald Ash. Each reader is a "voice" persona that reshapes the reading's intro, bridges, closings, and card prefixes.
- Reader catalog is **static config** in `src/lib/readers.ts` (`READERS`, `READER_IDS`, `ReaderId` type, `DEFAULT_READER`). Each entry has `id`, `aura` (currently all use `var(--text-color)` — no per-reader colors without approval), and `avatar` path (placeholder — images don't exist yet).
- Display strings (name, title, tagline, bio) and voice templates (intros, bridges, futureBridges, closings, pastPrefix/presentPrefix/futurePrefix) live in `messages/{locale}/readings.json` under `"readers.{id}"`. The registry file has no text.
- **Reader selection is session-scoped, not persisted.** `AppProvider` holds `selectedReader: ReaderId` in state (non-nullable, defaults to `DEFAULT_READER`). The reader persists across readings within the session — it is NOT reset when the tarot modal closes.
- **Main page flow:** OfferBlock shows the current reader (avatar, name, tagline) with "Summon [Name]" and "Change your reader" buttons. "Summon" cross-fades from reader to deck (0.8s CSS transition via `inner-wrap--reader`/`inner-wrap--deck` classes); "Change" opens an overlay modal with all 3 readers. Both reader and deck live inside the same `offer-block__screen--cards` container — no conditional rendering, just visibility toggling.
- **Subscription gating:** In the "Change your reader" modal, non-default readers have their summon button replaced with "Upgrade to unlock" for free/anonymous users. Only subscribers can pick a different reader.
- `Tarot.tsx` has no reader selection logic — it just uses `state.selectedReader` as-is.
- **Post-reading actions:** After the reading modal is dismissed, two buttons appear side by side: "Unveil Another Fate" (reshuffles cards, stays in tarot modal) and "Back to the Sanctum" (closes everything, returns to main page with reader visible). Translation keys: `unveilAnotherFate`, `backToSanctum`.
- `generateReading()` accepts an optional `readerId` param. If that reader's block exists in the messages, it uses the reader's voice templates; otherwise falls back to `readingTemplates`.
- Selection UI lives in `src/components/ReaderSelection.tsx` (3-column card grid with hover-to-reveal bio + summon CTA, used inside a Modal overlay). Styles: `src/assets/scss/blocks/_reader-selection.scss`. Aura color flows via `--reader-accent` / `--card-accent` CSS custom properties.
- **Only English has reader translations.** Norwegian and Russian `readings.json` files don't have a `readers` block yet, so those locales show hardcoded defaults for the reader presentation and hide the "Change" button.
- **Adding a new reader:** Add an entry to `READERS` in `src/lib/readers.ts`, add the matching block to `messages/{locale}/readings.json` under `"readers.{newId}"` (same structure as existing readers: displayName, title, tagline, bio, intros, bridges, futureBridges, closings, pastPrefix, presentPrefix, futurePrefix). The selection UI and reading generator pick it up automatically.

## Animations

### Intro animations (play once per session)

The main page has a multi-stage intro: moon rises and falls, title slides in, cards section fades in, smoke fades in, header slides down. These are CSS animations triggered by the `loaded` class on the offer-block, with staggered `animation-delay` values.

**Skip-intro pattern:** Animations play on first visit and page refresh, but NOT on client-side navigation (clicking logo, changing language, navigating back from other pages).

- Module-level `let hasPlayedIntro = false` in `OfferBlock.tsx` (and `hasPlayedHeaderIntro` in `Header.tsx`) — resets on page refresh (JS reloads), persists on client-side navigation.
- `useState` initializer checks and sets the flag. When skipping, `isLoaded` starts as `true` (no loading flash).
- `skip-intro` CSS class sets `animation-duration: 0s; animation-delay: 0s` on **specific elements only**: `.offer-block__title`, `.moon`, `.offer-block__screen--cards`, `.offer-block__reader`, `.smoke-animation`. The `forwards` fill mode keeps them at their end state.
- **NEVER use wildcard selectors** (`*`) for skip-intro — it kills unrelated animations (deck glow, card twist). Always list specific elements.
- Header uses the same pattern with its own `skip-intro` class in `_main-header.scss`.

### Reading reveal flow

After the user clicks the deck (which appears after clicking "Summon" on the main page):

1. "Unveil Your Destiny" text visible while cards are being flipped
2. Last card clicked → flip animation plays (2s)
3. After flip completes (2s timeout) → `showLoader` = true, text fades out (`tarot__title--hidden`), ouroboros SVG fades in (`tarot__loader` with `tarotLoaderFadeIn`)
4. 3 more seconds (5s total) → `isPredictionReady` = true, reading modal appears, loader fades out (`tarot__loader--hidden`)
5. User closes reading modal → two buttons appear in `tarot__post-actions` (flex row): "Unveil Another Fate" reshuffles and resets cards in-place; "Back to the Sanctum" calls `handleClose()` which resets all state and returns to main page with reader

**Key:** The loader uses the ouroboros SVG directly (`import LoaderSvg from "@/assets/svg/ouroboros.svg"`), NOT the `Loader` component (which is full-screen `position: fixed`).

### Deck card glow

The deck card on the main page has a `glowing` effect (conic-gradient `::before` pseudo-element). It uses a custom `glowPulseDeck` keyframe scaled to 0.8 (defined in `_offer-block.scss`). Glow is active when the deck is idle (`!isDeckShaking && !state.isCardsModalOpen`).
