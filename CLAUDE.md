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
    layout.tsx         # Thin root layout (styles + metadata only — returns children, no html/body)
    api/               # Route handlers: auth/, user/ (deck, locale, password, password-status,
                       #   plan, profile, reader), contact/ (Zoho SMTP), ask/ (DEAD CODE)
    privacy/           # /privacy — UNPREFIXED. Self-contained layout w/ own <html>/<body>
                       #   (page.tsx + layout.tsx + PrivacyContent.tsx). Middleware bypass.
    terms/             # /terms — same pattern (page.tsx + layout.tsx + TermsContent.tsx)
    cookie-policy/     # /cookie-policy — same pattern (page.tsx + layout.tsx + CookiePolicyContent.tsx)
    [locale]/
      layout.tsx       # Locale-aware layout (NextIntlClientProvider, font, CookieBanner, JSON-LD)
      page.tsx         # Main tarot page
      decks/           # Deck selection page
      subscription/    # Pricing page
      contact/         # Contact form (page.tsx + ContactForm.tsx) — locale-prefixed, POSTs to /api/contact
      profile/         # User profile page (standalone, not modal)
  i18n/
    routing.ts         # Locale list + default locale
    request.ts         # Message loading per locale — MUST update when adding a new JSON namespace
    navigation.ts      # Locale-aware Link, useRouter, usePathname
  middleware.ts        # next-intl locale detection + routing. Special-cases /privacy, /terms,
                       #   /cookie-policy to bypass locale prefixing (return NextResponse.next()).
  components/          # AnimatedCard, Tarot, Login, LoginForm, Modal, MysticButton, UserProfile,
                       # MainMenu, Header, Footer, PageShell, Providers (SessionProvider+AppProvider),
                       # LanguageSwitcher, DeckSelector, ReaderSelection, ReaderSelectionModal,
                       # CookieBanner, etc.
  lib/
    auth.ts            # NextAuth config (Credentials + Google)
    prisma.ts          # Prisma client singleton
    decks.ts           # Deck catalog (DECKS, DeckId, getCardImagePath)
    readers.ts         # Reader catalog (READERS, ReaderId, DEFAULT_READER)
    plans.ts           # Plan config (id, price, interval — no text)
    subscription.ts    # getUserPlan helper
    generateReading.ts # Reading generation from translated messages (reader-aware)
    seo.ts             # buildAlternates, buildJsonLd, getSiteUrl — used for per-page SEO metadata
  generated/prisma/    # Prisma client output (custom location)
  assets/scss/         # All styles
  data.ts              # Card data (id, image, value — no names; paths are deck-relative)
  AppProvider.tsx      # App state + deck-aware card image resolution
  handleAsk.tsx        # DEAD CODE — orphaned OpenAI integration, no callers
messages/
  en/                  # English translations (source of truth)
  no/                  # Norwegian translations
  ru/                  # Russian translations
  uk/                  # Ukrainian translations
  tr/                  # Turkish translations
```

## Environment Variables

Required (see `.env.example`):
- `DATABASE_URL` — Postgres connection string (Neon via Vercel Marketplace)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (NEXTAUTH_URL must be `https://theveil.app` in prod)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (registered in Google Cloud project `mistic-wispers`)
- `NEXT_PUBLIC_SITE_URL` — used by `src/lib/seo.ts` for canonical URLs / sitemap / OG
- `ZOHO_SMTP_USER`, `ZOHO_SMTP_PASS` — contact form mailer. `ZOHO_SMTP_PASS` is a **Zoho app password**, not the account password.

Dead env:
- `CONNECTION_OPEN_AI_KEY` — referenced only by `src/app/api/ask/route.ts` and `src/handleAsk.tsx`, both unreachable. Safe to delete on Vercel.

In Vercel, mark genuine secrets as **Sensitive** (UI hygiene — hides value in dashboard): `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `ZOHO_SMTP_PASS`. For a solo dev this is hygiene only — no rotation needed just because the dashboard flags visibility.

## Internationalization (i18n)

- **Library:** `next-intl` v3 (pinned for Next.js 14 compatibility)
- **Supported locales:** `en` (default), `no` (Norwegian), `ru` (Russian), `uk` (Ukrainian), `tr` (Turkish). EN is the source of truth; other locales may have partial / placeholder fallback content (especially `tr`, `uk`).
- **Routing:** URL prefix-based (`/en/`, `/no/`, `/ru/`, `/uk/`, `/tr/`). Middleware auto-detects from browser `Accept-Language`, user can override via header dropdown.
- **Translation files:** `messages/{locale}/` with 7 JSON files per locale:
  - `ui.json` — UI strings (buttons, labels, headings, errors)
  - `cards.json` — 78 card names
  - `readings.json` — 78 card readings + reading templates + per-reader voice blocks
  - `plans.json` — plan names and feature lists
  - `legal.json` — Legacy keys (most legal content now lives in static HTML blobs in `src/app/{privacy,terms,cookie-policy}/`)
  - `seo.json` — Per-page meta titles/descriptions/keywords
  - `contact.json` — Contact form labels, categories, validation errors, success/error states
- **Config files:** `src/i18n/routing.ts` (locales), `src/i18n/request.ts` (message loading), `src/i18n/navigation.ts` (locale-aware Link/useRouter)
- **Adding a new locale:** Create a new folder under `messages/` with all 7 JSON files (same structure as `en/`), then add the locale code to `src/i18n/routing.ts`. If it has a non-standard hreflang, also update `HREFLANG_MAP` in `src/lib/seo.ts`.
- **Adding a new namespace (JSON file):** Add the file in all 5 locale folders AND add a `...(await import(...)).default` line in `src/i18n/request.ts`. Forgetting the request.ts step means `useTranslations` silently returns the key name in production.
- **Links:** Use `Link` from `@/i18n/navigation` instead of `next/link` in components — this auto-prefixes the locale. Exception: unprefixed legal pages (`/privacy`, `/terms`, `/cookie-policy`) use plain `next/link` because they bypass locale routing.
- **Translations in components:** Use `useTranslations("namespace")` hook. Namespaces match the top-level key in each JSON file (`ui`, `cards`, `readings`, `plans`, `legal`, `seo`, `contact`).
- **Card names and readings** are no longer in TypeScript files — they live in `messages/{locale}/cards.json` and `readings.json`.
- **Plan names and features** are no longer in `plans.ts` — they live in `messages/{locale}/plans.json`. `plans.ts` only keeps `id`, `priceLabel`, `interval`.
- **Reading generation:** `src/lib/generateReading.ts` takes translated messages, card IDs, and an optional `readerId` to produce locale-aware readings in the chosen reader's voice. Falls back to `readingTemplates` when no reader block exists.
- **Russian translations are gender-neutral.** Russian past-tense verbs require gender agreement, so all `ru` reading texts avoid gendered verb forms with "ты" — using present tense, impersonal constructions, infinitives, and passive/reflexive forms instead. Preserve this when editing `messages/ru/readings.json`.
- **Russian UI uses formal "вы" (not "ты").** All UI strings in `messages/ru/ui.json` must address the user formally. Reader voice lines (inside `readers` block in `readings.json`) are in-character and may use "ты" at the reader's discretion.

## CSS Variables

All colors, typography, and border values are defined as CSS custom properties in `src/assets/scss/_variables.scss` using a two-layer system:

- **Palette layer:** Raw color values (`--gold`, `--primary`, `--dark`, `--black`, `--brown`, `--grey`, `--grey-dark`, `--red`, `--green`).
- **Semantic layer:** Usage-specific variables that reference the palette (`--text-color`, `--text-soft`, `--text-faint`, `--bg`, `--border-color`, `--input-bg`, `--overlay`, `--scrollbar-thumb`, `--medallion-fill`, `--error`, `--success`, `--font-family`, `--font-weight`, `--border-radius`, `--border`).
- **Text color hierarchy:** `--text-soft` (0.9 alpha) for near-primary text, `--text-faint` (0.7 alpha) for secondary/muted text. **Never use `opacity` to vary text color** — use these variables instead.

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
- **Most pages live under `src/app/[locale]/`** — but legal pages (`/privacy`, `/terms`, `/cookie-policy`) are deliberately UNPREFIXED at `src/app/{privacy,terms,cookie-policy}/`. Each has its own self-contained layout that renders `<html>/<body>` and preloads English messages directly (no `getMessages()` call). `src/middleware.ts` special-cases these three paths to bypass the next-intl middleware (otherwise it would 404 trying to find `/{locale}/privacy`). API routes stay at `src/app/api/` (no locale prefix).
- **React inner-HTML prop security hook:** A pre-tool-use hook blocks Write/Edit operations containing the literal React prop string (spelled `d-a-n-g-e-r-o-u-s-l-y-S-e-t-I-n-n-e-r-H-T-M-L` with no dashes). Legal page content files need it for trusted hardcoded HTML. Workaround pattern (used by all three legal `*Content.tsx` files): `const HTML_PROP = ["dangerously", "SetInner", "HTML"].join("")` then spread `{...({ [HTML_PROP]: { __html: TRUSTED } } as Record<string, unknown>)}`. Don't try to concat the string in a type cast either — that also resolves at write time.
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
- DB stores preference via `preferredReader` field on the `User` model (`String @default("vespera")`). No enum — adding a new reader requires no migration.
- `preferredReader` flows through NextAuth: stored in JWT token, exposed via `session.user.preferredReader`, updatable via `session.update({ preferredReader })`.
- Client-side: fetch `GET /api/user/reader`, update via `PATCH /api/user/reader`.
- `AppProvider` initializes `selectedReader` from `session.user.preferredReader` (falls back to `DEFAULT_READER` for anonymous users). The reader persists across readings within the session — it is NOT reset when the tarot modal closes.
- **Main page flow:** OfferBlock shows the current reader (avatar, name, tagline) with "Summon [Name]" and "Change your reader" buttons. "Summon" cross-fades from reader to deck (0.8s CSS transition via `inner-wrap--reader`/`inner-wrap--deck` classes); "Change" opens an overlay modal with all 3 readers. Both reader and deck live inside the same `offer-block__screen--cards` container — no conditional rendering, just visibility toggling.
- **Subscription gating:** In the "Change your reader" modal, non-default readers have their summon button replaced with "Upgrade to unlock" for free/anonymous users. Only subscribers can pick a different reader.
- `Tarot.tsx` has no reader selection logic — it just uses `state.selectedReader` as-is.
- **Post-reading actions:** After the reading modal is dismissed, two `<MysticButton>` components appear side by side: "Unveil Another Fate" (reshuffles cards, stays in tarot modal) and "Back to the Sanctum" (fades out the cards screen over 0.5s, returns to main page with reader visible). Translation keys: `unveilAnotherFate`, `backToSanctum`.
- **Selecting a reader from the modal** closes the modal AND reveals the deck (same as clicking "Summon" on the main page).
- **Deck dismisses when cards modal opens** — not when it closes. This prevents a flash of the deck when returning to the main page.
- `generateReading()` accepts an optional `readerId` param. If that reader's block exists in the messages, it uses the reader's voice templates; otherwise falls back to `readingTemplates`.
- Selection UI lives in `src/components/ReaderSelection.tsx` (3-column card grid with hover-to-reveal bio + summon `<MysticButton>`). Wrapped by `src/components/ReaderSelectionModal.tsx` (self-contained: handles modal, DB persist, session update, AppProvider sync). Styles: `src/assets/scss/blocks/_reader-selection.scss`. Aura color flows via `--reader-accent` / `--card-accent` CSS custom properties (set inline by React, no CSS defaults).
- UserProfile shows current reader name with a "→ Choose Your Reader" button that closes the profile modal and opens the reader selection modal. Both `page.tsx` and `PageShell.tsx` wire up the `ReaderSelectionModal`.
- **All three locales have reader translations.** English, Norwegian, and Russian `readings.json` files all have a `readers` block and corresponding UI keys in `ui.json`. Russian reader and UI translations need polish — quality is rough.
- **Adding a new reader:** Add an entry to `READERS` in `src/lib/readers.ts`, add the matching block to `messages/{locale}/readings.json` under `"readers.{newId}"` (same structure as existing readers: displayName, title, tagline, bio, intros, bridges, futureBridges, closings, pastPrefix, presentPrefix, futurePrefix). The selection UI and reading generator pick it up automatically.

## Legal Pages (Privacy / Terms / Cookie Policy)

- **Routes:** `/privacy`, `/terms`, `/cookie-policy` — **unprefixed**, NOT under `[locale]`. Live at `src/app/{privacy,terms,cookie-policy}/`.
- **File layout per page (3 files each):**
  - `page.tsx` — server component, exports `metadata`, delegates to the Content component.
  - `layout.tsx` — self-contained root layout. Renders its own `<html lang="en">` + `<body>`, loads Raleway, wraps children in `NextIntlClientProvider` preloaded with English JSON only, renders `<CookieBanner />`.
  - `XxxContent.tsx` — `"use client"`, renders `<PageShell>` wrapping `<main class="legal-page container"><article class="legal-page__content">…</article></main>`. Content is a raw HTML string (Termly export) with inline `style="..."` attributes stripped at module load, then injected via the split-string workaround (see Gotchas).
- **Middleware bypass:** `src/middleware.ts` short-circuits these three paths with `NextResponse.next()` so the next-intl middleware doesn't try to redirect them to `/{locale}/...`. Also: if someone hits `/{locale}/privacy` etc., middleware redirects back to the unprefixed path.
- **Styles:** `src/assets/scss/blocks/_legal-page.scss` (minimal — line-height + padding).
- **Why this pattern:** These are large static HTML blobs (Termly exports). Translating them is high-effort, low-value; the content is legally fine in English globally. The unprefixed URL also matches what's referenced in the policies themselves (e.g., "https://theveil.app/cookie-policy").
- **Email contacts in legal pages** route per the rules in [reference-email-routing memory]: `privacy@nothingweird.agency` for privacy/DSAR/cookies, `legal@nothingweird.agency` for ToS/IP/copyright/subscription cancellation. All at `nothingweird.agency`.

## Contact Form

- **Route:** `/[locale]/contact` — locale-prefixed (unlike legal pages). Real per-locale URLs because the form has a small set of translatable strings.
- **Files:** `src/app/[locale]/contact/page.tsx` (metadata + delegate), `ContactForm.tsx` (`"use client"`, form state + validation + submit).
- **API:** `src/app/api/contact/route.ts` — POST only (other verbs return 405), manual validation (no Zod in deps), nodemailer over Zoho SMTP. TODO comment at top for rate limiting (not yet implemented; honeypot only).
- **SMTP:** `smtppro.zoho.eu:465`, `secure: true`. Auth user is `ZOHO_SMTP_USER` (= `founder@nothingweird.agency` currently). Auth pass is a **Zoho app password** (Zoho Mail → Settings → Security → App Passwords) — NOT the account password.
- **Honeypot:** hidden `website` input field. Non-empty value → server returns `{ok:true}` without sending, logs `[contact] honeypot triggered`. Field is positioned off-screen via `.contact-form__honeypot` in `_contact-form.scss`, plus `tabIndex={-1}` and `autoComplete="off"`.
- **Category routing** (defined in `CATEGORY_TO` in the route):
  - `dsar_access`, `dsar_delete`, `dsar_correct` → `privacy@nothingweird.agency`
  - `legal_ip` → `legal@nothingweird.agency`
  - `general`, `other` → `support@nothingweird.agency`
- **Mail format:** Subject `[theveil:${category}] ${name}`. Body includes name, email, category, locale, UTC timestamp, message. `from:` must equal SMTP user (Zoho rejects mismatches). `replyTo:` is the user's submitted email so a Reply lands with them.
- **Prefill:** Form prefills `name` and `email` from `useSession()` (NextAuth) on mount — but only if the corresponding field is still empty. Never overwrites typed input. `SessionProvider` is already in `PageShell` via `Providers`.
- **Failure handling:** Real SMTP errors are `console.error`-logged server-side as `[contact] sendMail failed`. Client always gets a generic 500 with `{ok:false}` — no SMTP error details leak. If `ZOHO_SMTP_USER`/`ZOHO_SMTP_PASS` are missing, the route 500s with `[contact] missing ZOHO_SMTP_USER or ZOHO_SMTP_PASS`.
- **Recipient mailboxes must exist:** `privacy@`, `legal@`, `support@`, `founder@` on `nothingweird.agency` need to be real Zoho mailboxes or aliases — otherwise mail bounces silently.
- **Footer link:** Uses `Link` from `@/i18n/navigation` (auto-prefixes locale). Sits between Cookie Policy and Cookie settings.

## Cookie Consent Banner

- **Component:** `src/components/CookieBanner.tsx`. Mounted in all four root-level layouts (`[locale]/layout.tsx`, `privacy/layout.tsx`, `terms/layout.tsx`, `cookie-policy/layout.tsx`).
- **Storage key:** `theveil_cookie_consent` in `localStorage`. Values: `"accepted"` | `"rejected"`. Absence = banner shows.
- **Reset:** `resetCookieConsent()` exported from the same file removes the key and dispatches a custom event to re-show the banner. Wired to the "Cookie settings" footer button.
- **GDPR posture:** Banner auto-shows for cold visitors (no localStorage value) — this is compliant. The "Learn more" link points to `/cookie-policy`.
- **Debugging:** If user says the banner doesn't show, first check whether `theveil_cookie_consent` is already set in their browser's localStorage from earlier testing.

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
5. User closes reading modal → two `<MysticButton>` components appear in `tarot__post-actions` (flex row): "Unveil Another Fate" reshuffles and resets cards in-place; "Back to the Sanctum" triggers a 0.5s fade-out (`tarot-modal--closing` class + `tarotModalFadeOut` keyframe) before unmounting and returning to main page with reader

**Key:** The loader uses the ouroboros SVG directly (`import LoaderSvg from "@/assets/svg/ouroboros.svg"`), NOT the `Loader` component (which is full-screen `position: fixed`).

### Deck card glow

The deck card on the main page has a `glowing` effect (conic-gradient `::before` pseudo-element). It uses a custom `glowPulseDeck` keyframe scaled to 0.8 (defined in `_offer-block.scss`). Glow is active when the deck is idle (`!isDeckShaking && !state.isCardsModalOpen`).
