# Project: Tarot Next App

## Infrastructure

- **Hosting:** Vercel (paid plan)
- **Database:** PostgreSQL via Prisma (Vercel Postgres / Prisma Data Platform)
- **Prisma version:** v6 — DO NOT UPGRADE
- **Auth:** NextAuth v4 with Prisma adapter
- **Framework:** Next.js 14, App Router, React 18, TypeScript
- **Styling:** SCSS (`src/assets/scss/`)

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
                       # PageShell, LanguageSwitcher, DeckSelector, etc.
  lib/
    auth.ts            # NextAuth config (Credentials + Google)
    prisma.ts          # Prisma client singleton
    decks.ts           # Deck catalog (DECKS, DeckId, getCardImagePath)
    plans.ts           # Plan config (id, price, interval — no text)
    subscription.ts    # getUserPlan helper
    generateReading.ts # Reading generation from translated messages
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
  - `readings.json` — 78 card readings + reading templates
  - `plans.json` — plan names and feature lists
  - `legal.json` — Terms of Service + Privacy Policy
- **Config files:** `src/i18n/routing.ts` (locales), `src/i18n/request.ts` (message loading), `src/i18n/navigation.ts` (locale-aware Link/useRouter)
- **Adding a new language:** Create a new folder under `messages/` with all 5 JSON files (same structure as `en/`), then add the locale code to `src/i18n/routing.ts`.
- **Links:** Use `Link` from `@/i18n/navigation` instead of `next/link` in components — this auto-prefixes the locale.
- **Translations in components:** Use `useTranslations("namespace")` hook. Namespaces match the top-level key in each JSON file (`ui`, `cards`, `readings`, `plans`, `legal`).
- **Card names and readings** are no longer in TypeScript files — they live in `messages/{locale}/cards.json` and `readings.json`.
- **Plan names and features** are no longer in `plans.ts` — they live in `messages/{locale}/plans.json`. `plans.ts` only keeps `id`, `priceLabel`, `interval`.
- **Reading generation:** `src/lib/generateReading.ts` takes translated messages and card IDs to produce locale-aware readings.
- **Russian translations are gender-neutral.** Russian past-tense verbs require gender agreement, so all `ru` reading texts avoid gendered verb forms with "ты" — using present tense, impersonal constructions, infinitives, and passive/reflexive forms instead. Preserve this when editing `messages/ru/readings.json`.

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
- Out of scope until separate specs land: free-tier enforcement (counting 3 readings/day), reading history UI, diviner selection.

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
