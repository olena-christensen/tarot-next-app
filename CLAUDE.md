# Project: Tarot Next App

## ⚠️ THIS APP IS MOBILE-FIRST — MOBILE-FIRST — MOBILE-FIRST

**Every responsive style in this project is MOBILE-FIRST.** Base styles target
mobile; you scale **UP** with `respond-above` / `min-width`. This is not a
preference and it is not up for debate:

- **DO** write the mobile layout as the base, then add `@include respond-above(...)` for larger screens.
- **DO NOT** write desktop-first styles. **DO NOT** use `respond-below` as the default. **DO NOT** flip an existing `respond-above` to `respond-below`.
- **DO NOT** label the app "desktop-first," argue mobile-first vs desktop-first, or lecture about either. Mobile-first. Full stop.

Mobile-first, mobile-first, mobile-first. If you are about to write a
`max-width` media query as the default, stop — you are doing it wrong.

## Infrastructure

- **Hosting:** Vercel — **Hobby (free) plan**. Two consequences: crons may run **once per day only**, with ±59 min scheduling imprecision (so never depend on a cron firing at a precise hour); and Vercel's fair-use guidelines restrict Hobby to **non-commercial use**, which selling subscriptions is not — **Pro ($20/mo) is required before taking real money**. See `docs/go-live.md` → Blocking.
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
- **NEVER run git add, git commit, git stage, or any git write operation** — the user does their own commits. (Do not assume or name a specific editor/tool, and never explain how to commit/push.) Subagents must NOT touch git either. Read-only git commands (status, log, diff) are fine.
- **ALWAYS use Opus model** — never use Sonnet, Haiku, or any other model for subagents or any task
- **Document rules, conventions, decisions, and handovers in repo files (this CLAUDE.md or `docs/`) — NEVER in agent/private memory.** Everything must be human-readable by the user and any dev, and re-read from the file each session. Do not rely on private memory for durable knowledge; if you learn something worth keeping, write it into the relevant repo file.
- **Dev server runs on `localhost:3001`** (not 3000 — the user runs multiple projects).
- When reducing permission prompts / fixing settings, edit `.claude/settings.json` directly — don't run steps that themselves prompt (transcript scans, out-of-project reads). In subagents, use the Read tool, not `cat`/`ls`/`for` loops (shell expansion defeats the allowlist).

## Handover Convention

When asked for a handover note (or when preparing to clear the session), output **one markdown code block, copy-paste ready, with no surrounding prose and no self-evaluation round** — get it right on the first pass. Sections, each terse:
1. **Header** — branch · commit status · dev server
2. **What shipped** — numbered, one line each
3. **Verified vs not** — MANDATORY, three tiers, never inflate: (a) verified live (ran it / screenshots / assertions), (b) typecheck-clean only / not seen working, (c) needs manual or login check
4. **Files touched** — SCSS / TSX / config, terse
5. **Next up** — pulled from `TODO.md`
6. **Working style** — only the non-obvious constraints

Never present unverified or typecheck-only work as "done" — the Verified-vs-not split is the whole point.

## Working Style

**Do exactly what's asked; minimal interpretation.**
- 🚫 **NEVER start work you were not explicitly asked to do. This is the hardest rule in this file.** Do the one thing requested, then **STOP and wait**. No extras, no "while I'm here," no previews, no screenshots, no demos, no mocking states, no verifying-adjacent things, no follow-on cleanup beyond the task, no "let me also…". Answering a question = answer it and stop; giving a URL = give it and stop. Unrequested work **wastes the user's time** and is treated as a failure regardless of how useful it seems. If you believe something else is worth doing, **ask in one sentence and wait for a yes** — do not begin it. If the user says "stop," stop **immediately and completely** — do not drift back into the same thing under the guise of cleanup or "just finishing."
- Follow the literal request; don't expand scope or refactor unasked. "Use same SVG" = the SVG file, not the component wrapping it.
- A pasted error or observation is **information, not a work order** — diagnose and explain it, and ask before touching code (especially anything outside the stated task). Check whether the cause is even in the code (e.g. a `WebGL context` error was browser context-exhaustion from a long HMR session — fixed by restarting the browser, zero code change).
- Never change the behavior of a feature the user didn't ask about, and don't make product/design calls (e.g. "degrade silently") — surface the option and let them decide.
- "Add to TODO" = just add it to `TODO.md`; don't start investigating or implementing.

**Consult before deciding.**
- Present naming, structure, and architectural decisions for approval **before** implementing — don't bulldoze conventions across files.
- When the user voices a concern about a choice already made ("I like X but worried about Y"), answer Y directly. Don't generate new alternatives unless asked.

**Communication.**
- Direct and dense. Cut filler, hedging, throat-clearing, and narration of routine steps or things an experienced dev already knows (how to commit, basic tooling).
- **NO standing status recaps** — say a thing once; don't re-emit "what's done / uncommitted / left" every turn.
- Copy-paste content goes in a fenced code block, **never** a `>` blockquote (the `>` chars and border get copied).
- Never say "it doesn't exist" from a narrow search — grep broadly; if still not found, say "I can't find it — where are you seeing it?"

**Commit messages.**
- "Give me a commit message" means for the **currently uncommitted changes only** — run `git status` first. The user commits after each ask, so NEVER bundle in prior/already-committed work.
- Keep it short and match the size of the change. A routine CSS/UI tweak gets a **one-line subject, no body** (`fix(layout): pin footer to bottom on short pages`). Don't write a multi-paragraph rationale/"engineering novel" for a small job. Add a body only for genuinely complex or non-obvious changes.

**Don't touch — the user owns these.**
- Vercel platform: never run `vercel` writes / deploys / env changes — guide via the **dashboard**. Editing local `.env` is fine. (Git writes: never — see Rules.)
- **Local env lives in `.env` — ONE file. `.env.local` is not used in this project; never create, reference, or suggest it.**
- Solo project — Olena is the only account holder (Vercel, Google Cloud, Zoho, OpenAI). Don't prescribe team-style secret rotation; rotate only on a real leak. "Sensitive" flags are UI hygiene only. Explain console jargon (OAuth client, IAM, credentials) in plain language.

**CSS / UI.**
- Modern shorthand (`inset: 0`, `gap`). Keep component styles self-contained — never leak a parent's layout concerns into a child.
- Reusable components carry only intrinsic styles (padding/font/color/border) — **NEVER** layout (`flex`, `width`, `min-width`, `text-align`); layout belongs to the parent that owns the context.
- New buttons/UI match sibling styling — no "simplified/subtle" variants unless asked.
- Don't set CSS variable defaults that React always overrides inline (dead code).
- Never wildcard-override animations; understand every keyframe/delay/end-state before changing the hand-crafted intro animations.

**Permission prompts (avoid bouncing them back).**
- Run Bash bare — no `cd <abspath> &&` prefix (cwd is already the project root; the prefix turns an auto-allowed read into a prompt). One purpose per command, not bundled behind `echo "==="`.
- `$(...)`, `source`, and `$VAR` expansion always prompt — wrap dynamic parts in an `npm run` alias. For a directly-requested local API call, use the alias **and** pass `dangerouslyDisableSandbox: true` (network calls prompt separately from the permission rule).

## Commands

```bash
npm run dev    # Next dev server (localhost:3001)
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
                       # SubscriptionPlans, SubscriptionModal, CookieBanner, etc.
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

- **⚠️ Finalization gate — every task that touches code must end with a translation check.** Before calling any code-touching task done, ask: did this add or change a user-facing string, a new key, or a new namespace? If yes, it is NOT finished until that string exists in **all** locales (`en`/`no`/`ru`/`uk`/`tr`) — never leave EN-only keys or English placeholders in the other files. A new namespace also needs the `request.ts` import line. This is part of "done," not a follow-up. (Coverage can be verified with a key-by-key audit against EN — 0 missing, 0 empty, 0 leftover-English except intentional brand/proper-noun keys.)
- **Library:** `next-intl` v3 (pinned for Next.js 14 compatibility)
- **Supported locales:** `en` (default), `no` (Norwegian), `ru` (Russian), `uk` (Ukrainian), `tr` (Turkish). EN is the source of truth; other locales may have partial / placeholder fallback content (especially `tr`, `uk`).
- **Routing:** URL prefix-based (`/en/`, `/no/`, `/ru/`, `/uk/`, `/tr/`). Middleware auto-detects from browser `Accept-Language`, user can override via the header language picker. `LanguageSwitcher` (the header globe) opens a **modal** (the shared `.options-modal` radio list + Save, same UI as the profile's language field) — the choice applies only on **Save**, not instantly on click. It persists via `PATCH /api/user/locale` for signed-in users (best-effort) and switches the route.
- **Translation files:** `messages/{locale}/` with 7 JSON files per locale:
  - `ui.json` — UI strings (buttons, labels, headings, errors)
  - `cards.json` — 78 card names
  - `readings.json` — 78 card readings + reading templates + per-reader voice blocks
  - `plans.json` — plan names and feature lists
  - `disclaimers.json` — Entertainment-only + age-gate disclaimer strings (used by `Footer` and the age confirmation). Legal page bodies are NOT translated — they live as static English HTML blobs in `src/app/{privacy,terms,cookie-policy,refund}/`.
  - `seo.json` — Per-page meta titles/descriptions/keywords
  - `contact.json` — Contact form labels, categories, validation errors, success/error states
- **Config files:** `src/i18n/routing.ts` (locales), `src/i18n/request.ts` (message loading), `src/i18n/navigation.ts` (locale-aware Link/useRouter)
- **Adding a new locale:** Create a new folder under `messages/` with all 7 JSON files (same structure as `en/`), then add the locale code to `src/i18n/routing.ts`. If it has a non-standard hreflang, also update `HREFLANG_MAP` in `src/lib/seo.ts`.
- **Adding a new namespace (JSON file):** Add the file in all 5 locale folders AND add a `...(await import(...)).default` line in `src/i18n/request.ts`. Forgetting the request.ts step means `useTranslations` silently returns the key name in production.
- **Links:** Use `Link` from `@/i18n/navigation` instead of `next/link` in components — this auto-prefixes the locale. Exception: unprefixed legal pages (`/privacy`, `/terms`, `/cookie-policy`) use plain `next/link` because they bypass locale routing.
- **Translations in components:** Use `useTranslations("namespace")` hook. Namespaces match the top-level key in each JSON file (`ui`, `cards`, `readings`, `plans`, `disclaimers`, `seo`, `contact`).
- **Card names and readings** are no longer in TypeScript files — they live in `messages/{locale}/cards.json` and `readings.json`.
- **Plan names and features** are no longer in `plans.ts` — they live in `messages/{locale}/plans.json`. `plans.ts` only keeps `id`, `priceLabel`, `interval`.
- **Reading generation:** `src/lib/generateReading.ts` takes translated messages, card IDs, and an optional `readerId` to produce locale-aware readings in the chosen reader's voice. Falls back to `readingTemplates` when no reader block exists.
- **Russian translations are gender-neutral.** Russian past-tense verbs require gender agreement, so all `ru` reading texts avoid gendered verb forms with "ты" — using present tense, impersonal constructions, infinitives, and passive/reflexive forms instead. Preserve this when editing `messages/ru/readings.json`.
- **Russian UI uses formal "вы" (not "ты").** All UI strings in `messages/ru/ui.json` must address the user formally. Reader voice lines (inside `readers` block in `readings.json`) are in-character and may use "ты" at the reader's discretion. For the "reader" concept use **"таролог"**, never "гадалка" (crude/offensive). Russian brand equivalent of "The Veil" is **"Завеса"**. Russian translation quality across the app is rough and wants a dedicated native-level polish pass (not mixed into feature work).

## CSS Variables

All colors, typography, and border values are defined as CSS custom properties in `src/assets/scss/_variables.scss` using a two-layer system:

- **Palette layer:** Raw color values (`--gold`, `--primary`, `--dark`, `--black`, `--brown`, `--grey`, `--grey-dark`, `--red`, `--green`).
- **Semantic layer:** Usage-specific variables that reference the palette (`--text-color`, `--text-soft`, `--text-faint`, `--bg`, `--border-color`, `--input-bg`, `--overlay`, `--scrollbar-thumb`, `--medallion-fill`, `--error`, `--success`, `--font-family`, `--font-weight`, `--border-radius`, `--border`).
- **Text color hierarchy:** `--text-soft` (0.9 alpha) for near-primary text, `--text-faint` (0.7 alpha) for secondary/muted text. **Never use `opacity` to vary text color** — use these variables instead.

**There are NO SCSS variables for colors/typography/borders.** Everything uses `var(--xxx)` directly. The only SCSS variables that exist are mixin parameters.

- **Never hardcode color values** in SCSS files — always use the CSS custom properties.
- **Never introduce new colors** without explicit approval. Use existing palette variables.
- When you need an opacity variant of a palette color, use `rgba(250, 225, 163, 0.XX)` with the raw values (CSS `var()` can't be decomposed inside `rgba()`).

### Responsive breakpoints

Use the shared Sass mixins in `_mixins.scss` — do NOT write raw `@media` queries. Values are centralized in a `$breakpoints` map (`sm: 37.5em`/600px, `md: 48em`/768px, `lg: 56.25em`/900px):

- `@include respond-below($bp)` — `max-width` (use in desktop-first files).
- `@include respond-above($bp)` — `min-width` (use in mobile-first files).

**The whole app is mobile-first.** Base styles target mobile; scale UP with `respond-above`. `subscription`/`decks`/`legal-page` were converted from desktop-first on 2026-07-13 (their raw `max-width: 720px/960px` queries were remapped to the shared tokens `md`/`lg`). What remains as `respond-below` are small single-property tweaks inside mobile-first files (`_tarot`, `_main-header`, `_mystic-btn`, `_user-profile`, `_main-footer`, `_main-menu`, `_title`, `_reader-selection`) — a mobile base with a shrink override, NOT desktop-first; leave them unless doing a deliberate single-direction sweep. A global `overflow-x: hidden` safety net lives on `body` in `global/_scafolding.scss`. `.mystic-btn` has a mobile override (padding/font shrink at `respond-below(sm)`) and is reused on the offer-block Summon, tarot post-actions, and reader-selection — don't re-break it.

## Gotchas

- **Prisma schema lives at `src/generated/prisma/schema.prisma`**, not the conventional `prisma/` directory. This is set via the `prisma.schema` field in `package.json`. Don't move it.
- `prisma generate` runs as part of `build` — required for Vercel deploys.
- Prisma client is imported via `src/lib/prisma.ts` singleton — use that, don't instantiate `PrismaClient` elsewhere.
- NextAuth is **v4** (not v5/Auth.js). API routes use the `[...nextauth]/route.ts` pattern.
- **Sessions are JWT (`strategy: "jwt"`), so nothing reads the DB per request.** Deleting a `User` row out-of-band (Neon console, admin action, GDPR erasure) does NOT log that person out — the signed cookie keeps rendering their name/email/avatar; reads degrade to free-tier defaults and writes 500. Guarded since 2026-08-02: the `jwt` callback re-checks the user row at most once every `USER_VERIFY_INTERVAL_MS` (5 min, `src/lib/auth.ts`), stamping `token.verifiedAt`. **That same query also re-syncs the mutable profile fields** (`name`, `image`, `preferredDeck`, `preferredReader`, `preferredLocale`) back into the token — a JWT session is otherwise frozen at login, so an avatar uploaded on production never appeared in a local session, and any preference changed on one device stayed stale on another. The DB wins, which is safe because every writer persists before calling `update()`. Adding a new user-editable field? Add it to that select too, or it will silently go stale across sessions. If the row is gone it **throws** — that is the v4 mechanism for killing a JWT session (the session route catches it, logs `JWT_SESSION_ERROR`, clears the cookie). DB errors are caught and the session kept, so a Postgres blip can't sign everyone out. The app's own delete-account flow never relied on this: `UserProfile` calls `signOut()` right after `/api/user/delete`.
- The Vercel Postgres product was discontinued; the DB is now provisioned through the Vercel Marketplace (Neon). Treat it as plain Postgres via `DATABASE_URL`.
- **Most pages live under `src/app/[locale]/`** — but legal pages (`/privacy`, `/terms`, `/cookie-policy`) are deliberately UNPREFIXED at `src/app/{privacy,terms,cookie-policy}/`. Each has its own self-contained layout that renders `<html>/<body>` and preloads English messages directly (no `getMessages()` call). `src/middleware.ts` special-cases these paths (plus `/refund` and any `/payment/` route, e.g. the post-payment `/payment/result`) to bypass the next-intl middleware (otherwise it would 404 trying to find `/{locale}/privacy`). API routes stay at `src/app/api/` (no locale prefix).
- **React inner-HTML prop security hook:** A pre-tool-use hook blocks Write/Edit operations containing the literal React prop string (spelled `d-a-n-g-e-r-o-u-s-l-y-S-e-t-I-n-n-e-r-H-T-M-L` with no dashes). Legal page content files need it for trusted hardcoded HTML. Workaround pattern (used by all three legal `*Content.tsx` files): `const HTML_PROP = ["dangerously", "SetInner", "HTML"].join("")` then spread `{...({ [HTML_PROP]: { __html: TRUSTED } } as Record<string, unknown>)}`. Don't try to concat the string in a type cast either — that also resolves at write time.
- **`next-intl` v3 uses `unstable_setRequestLocale`** — not `setRequestLocale` (that's v4). Don't upgrade without checking the migration guide.
- **`params` is a direct object in Next.js 14** — not a Promise. Don't add `await params` (that's Next.js 16+).
- **Translation JSON files use namespaced top-level keys** (e.g., `{"ui": {...}}`). The namespace must match what `useTranslations("ui")` expects.
- **Migration history was baselined on 2026-04-07.** Earlier tables (Account, Session, User, etc.) were originally created via `db push`, so a baseline migration `20240101000000_baseline` plus markers for `add_user_created_at` and `add_terms_accepted_at` were added retroactively and `migrate resolve --applied` was used to record them. From here on, use `prisma migrate dev` for all schema changes.
- **Z-index layer scale (keep separated, do NOT collapse to equal values):** content ≤2 → `.main-header` 30 → `.tarot-modal` (full-screen reading screen) 40 → `.main-footer--overlay` 50 → `.cookie-banner` 60 → `.loader` 70 → `.modal` 100 → `.reader-selection__summon-pane` (mobile bottom sheet, portaled to `body`) 110 → `.language-switcher` dropdown 200. `Modal.tsx` **portals to `document.body`** so popups escape parent stacking contexts (especially the fixed `.tarot-modal`) and layer globally.
- **Single overlay footer.** There is ONE `<Footer overlay />`, rendered in `HomePageClient` as a sibling of `<main>` (NOT inside `<main>`, `OfferBlock`, or `Tarot`). Don't re-nest it — a `<footer>` inside `<main>` is the bug this fixed. The offer-block's reader/deck band (`.inner-wrap`) is top-anchored (`top: 25%` <900px, `top: 32%` ≥900px), NOT bottom-anchored — offer-block children are absolutely positioned.
- **Never gate a component that owns open modals on `status === "authenticated"`.** NextAuth's `update()` (called when persisting a preference — reader, deck, locale, etc.) flips `useSession().status` to `"loading"` mid-flight. A gate like `{status === "authenticated" && <UserProfile/>}` then unmounts the whole subtree — including any open `Modal` and its local `useState` (e.g. `isReaderSelectOpen`) — and remounts it a beat later with the modal closed. This looked like "the modal closes itself" with no `onClose` in the path. Gate on `session?.user` instead (session data persists across an `update()`); handle the unauthenticated case with a redirect effect. `ProfilePageClient.tsx` uses this pattern — don't reintroduce the `status`-based gate.

## Subscription / Pricing

- Plan catalog is **static config** in `src/lib/plans.ts` (`PLANS`, `PLAN_ORDER`, `PlanId` type). Edit copy here, no migration needed.
- **Tier names are themed ranks ("Set A — the Order"), renamed 2026-08-02:** FREE = *Seeker*, SINGLE = *Offering*, MONTHLY = *Initiate*, YEARLY = *Adept*. Names live in `messages/*/plans.json` only — the `PlanId` enum in the DB stays `FREE/SINGLE/MONTHLY/YEARLY` and all code keys off the enum, never the display name. Each locale's wording matches the vocabulary it already uses for the initiated (`history.lockedCta`, `ui.beginInitiation`) — e.g. TR *Ergin*, RU *Посвящённый*. Because a title no longer states the billing period, the `/month` + `/year` price suffixes on the cards are load-bearing — don't drop them. `PLAN_LABEL` in `mailer.ts` spells receipts as "Initiate (monthly)" for the same reason.
- DB only tracks **which plan a user is on** via the `Subscription` table (`userId @unique`, `planId` enum, `expiresAt`). Absence of a row = `FREE`.
- Read current plan with `getUserPlan(userId)` from `src/lib/subscription.ts` — never query `prisma.subscription` directly from UI code.
- **`isSubscriber` is THE entitlement flag and it is computed server-side.** `getSubscriptionStatus` derives it from `isActiveTier()` and `GET /api/user/plan` returns it. **Never re-derive entitlement from `planId` in a component.** Three components used to: `UserProfile` checked plan + expiry, `ReaderSelectionModal` checked `planId === "MONTHLY" || "YEARLY"`, `OfferBlock` checked `planId !== "FREE"` — so an **expired** subscriber kept premium readers while the profile correctly showed them as free (found 2026-08-02). All three now read `data.isSubscriber`. `planId` is still the right thing to read when you mean "which tier did they buy" (the pricing page's current-plan marker, the lapsed-state label) — just not for "may they do this".
- **Paid features must be enforced server-side, not just hidden in the UI.** `PATCH /api/user/reader` returns 403 `subscription_required` for any non-`DEFAULT_READER` when the tier isn't active; the modal's locked cards are cosmetic on top of that. Before 2026-08-02 the reader paywall was client-only — a single PATCH bought any user a premium reader. Deck selection is deliberately different: logged-in only, not paid-gated.
- Client-side: fetch `GET /api/user/plan` (mirrors the `password-status` pattern).
- Pricing page lives at `/subscription`, rendered by `src/components/SubscriptionPlans.tsx` (4-column classic layout). Styles: `src/assets/scss/blocks/_subscription.scss`.
- **In-app pricing modal:** `src/components/SubscriptionModal.tsx` wraps `<SubscriptionPlans showHeader={false} />` in a `wide` `Modal` and overrides `LoginContext` so a 401 from create-invoice closes the plans and hands off to login. It is the **in-app** pricing surface; the `/subscription` page is kept as the canonical SEO URL (linked from Terms/Refund). Entry points: home reading-gate (`onBlockedFree` in `HomePageClient`), and the profile's **Current plan**, **Reading Credits**, and reader **"upgrade to unlock"** edit actions (all `setIsSubscriptionOpen(true)` in `UserProfile`). It needs an ambient `LoginContext` (PageShell provides one; the home page passes `onRequestLogin` explicitly since its tree has none).
- **Current-plan indicator:** `SubscriptionPlans` fetches `GET /api/user/plan` on mount and marks the matching tier with `--current` — the same gold jewel bead as the current-reader marker in `_reader-selection.scss`, pinned top-left so it can't collide with the top-right "most popular" badge — plus a "Current plan" button label (disabled); Free shows "Included" when the user is on a higher tier; SINGLE stays purchasable. Anonymous/pre-fetch defaults to Free-as-current. Key: `ui.includedBtn` (all 5 locales).
- **Payment BACKEND is wired** (Plata by mono). `POST /api/payments/create-invoice` + signature-verified `POST /api/payments/webhook` create invoices and activate the `Subscription` server-side on confirmed payment. See `docs/features/mono-payments.md` for the full design. Schema extended with payment fields + a `Payment` ledger model (migrations 2026-06-25).
- **Payment FRONTEND is wired** (initiate + result page). `SubscriptionPlans.tsx` CTAs POST `/api/payments/create-invoice { planId }` and redirect the browser to Mono's `pageUrl` (per-button busy state; 401 → opens the branded login modal via `LoginContext`; other errors → visible `subscription__error` message). Mono redirects back to the **localized** `/{locale}/payment/result` page: `create-invoice` builds `redirectUrl = ${APP_URL}/${locale}/payment/result` from the locale the client sends, so the result page renders in the user's language (strings in the `payment` namespace, `messages/*/payment.json`, registered in `request.ts`). The unprefixed `src/app/payment/result` still exists as a fallback that `redirect()`s to the default locale (covers invoices created before this change / any redirect that drops the locale); `middleware` bypasses `/payment/` like the legal pages, and — unlike them — `/{locale}/payment/result` is NOT redirected back to the unprefixed path. That page re-checks `GET /api/user/plan` every ~1s for ~10s — confirming from server state (`paymentStatus`/`pendingPlanId`), never from the URL — and shows tier-active / credit-added / still-processing. `GET /api/user/plan` was extended to return `{ planId, readingCredits, paymentStatus, pendingPlanId }` (superset — the `{ planId }` shape still holds) via `getSubscriptionStatus` in `subscription.ts`. Still NOT built (separate slices): consuming `readingCredits` in the reading flow, free-tier gating, recurring renewal.
- **Pricing:** SINGLE €1 is a consumable reading credit (`readingCredits`), NOT a tier. MONTHLY €5 / YEARLY €39 set `planId`. Recurring renewal is not built and is blocked on monobank enabling tokenization.
- Out of scope until separate specs land: free-tier enforcement (counting 3 readings/day), credit consumption in the reading flow, reading history UI.
- **Status tracking:** `docs/go-live.md` is the single source of truth for what remains before launch.

## Password Reset ("forgot your password")

- **Entry point:** a `form__forgot` link under the password field in `LoginForm.tsx` (sign-in mode only). It swaps the login modal's body to an email form — no extra route.
- **`POST /api/auth/forgot-password`** — **always** returns `{ok:true}` for a well-formed email. Unknown address, Google-only account (no `password`), throttled request and mail failure all produce the identical response; anything else would make this an account-enumeration oracle. Same reason the client's "link sent" copy never confirms an account exists.
- **`POST /api/auth/reset-password`** — unknown / already-used / expired tokens all return the same `invalid_token` 400. On success it sets the bcrypt hash (cost 12, matching `register` and `user/password`), marks the token used, and deletes the user's other tokens, all in one `$transaction`.
- **`PasswordResetToken` model** (migration `add_password_reset_token`, 2026-08-02): only the **SHA-256** of the token is stored — the raw value exists solely in the emailed link, so a DB leak can't reset anyone. Single-use, 1-hour TTL, and requesting a new link deletes any earlier one. Constants live in `src/lib/passwordReset.ts`.
- **Throttle:** one link per account per 60s (`RESET_THROTTLE_MS`), enforced by the newest token's `createdAt`. This is the app's only rate limiting — the contact route still has a TODO for it.
- **Email goes through `src/lib/mailer.ts`** (`sendPasswordResetEmail`) — never build a transporter in a route. The shared `send()` sets the `from` display name that deliverability depends on. It takes `{ html, unsubscribe }`: reset mail passes `unsubscribe: false`, because `List-Unsubscribe` belongs on subscription mail only — you cannot opt out of security email.
- **Email is localized** to the recipient's saved `preferredLocale` (falling back to the locale the request came from). `getResetEmailStrings()` imports `messages/{locale}/ui.json` directly, since next-intl's hooks aren't available in a route handler.
- **Auto sign-in after reset:** on success the endpoint returns the account's email (safe — only a valid-token holder reaches that branch, and they just set the password), and the client calls `signIn("credentials")` with the new phrase, so "back to the gate" lands them already logged in. A failed sign-in is non-fatal: the password still changed, they just arrive signed out.
- **Reset page:** `/[locale]/reset-password?token=…`, noindex. `useSearchParams()` forces client rendering, so `ResetPasswordClient` wraps the form in `<Suspense>` — without it the page fails to prerender at build time.
- **Route naming gotcha:** `forgot-password` / `reset-password` sit next to NextAuth's `[...nextauth]` catch-all under `src/app/api/auth/`. Static segments win over the catch-all in the App Router, so they resolve correctly — the build output lists all three.

## Reading History

- **Route:** `/[locale]/history` — own page (`page.tsx` + `HistoryPageClient.tsx` + `src/components/ReadingHistory.tsx`), `robots: noindex` like `/profile`. Styles: `_reading-history.scss`.
- **Subscriber-only to read.** `GET /api/readings` returns 403 `subscription_required` unless `isActiveTier(planId, expiresAt, now)` passes. That helper lives in `readingAccess.ts` and is shared with `decideReadingAccess` — do NOT re-implement the "is this a subscriber" rule anywhere else.
- **Write/delete endpoints are auth-only, deliberately NOT subscriber-gated** — someone who lapses to FREE must still be able to rename or erase their own data. `PATCH /api/readings/[id]` (rename, ≤80 chars, empty string clears back to null), `DELETE /api/readings/[id]` (one), `DELETE /api/readings` (purge all). All scope by `userId` as well as `id` via `updateMany`/`deleteMany`, so one user can never touch another's row and a miss returns 404 without a separate ownership query.
- **Pagination** is cursor-based on the row id (`?cursor=&take=`, default 20, max 50). The query fetches `take + 1` rows to derive `nextCursor` without a count query.
- `Reading.title` is a nullable column (migration `add_reading_title`, 2026-08-02). Entries render title (if named) + localized date **and time** — two readings on one day must be tellable apart.
- Both destructive actions confirm in a `Modal` before firing; the purge wording spells out that it cannot be undone.
- **"Save as PDF" is print, not a PDF library.** The per-entry printer button sets `printingId`; the container gets `data-printing="true"` and the chosen `<li>` gets its own, then `window.print()` fires on the next tick (the attribute must be in the DOM before the browser snapshots). `_print.scss` hides every sibling entry plus header/footer/actions, so the sheet holds exactly one reading — which is what the browser's "Save as PDF" destination produces. No new dependency.
- **`_print.scss` flips the semantic colour variables inside `@media print`** (`--bg` → `--white`, `--text-color`/`--primary` → `--black`, `--text-faint` → `--grey`) rather than restyling components. Browsers drop background colours by default, so the gold-on-black theme would print as pale gold on white paper — unreadable. `--white` was added to the palette **for print only**; do not use it on screen. Import `_print.scss` last so it wins.
- Profile links here via the **Ledger of Fates** row (see User Profile §): subscribers get the eye icon, free users a Begin Initiation button.
- **Empty state** shows the copy plus a centered `Draw Your First Fate` link back to `/` (`history.emptyCta`) — an empty ledger must offer the way to fill it, not just say it's empty.
- **Anchors styled as `.btn` need `text-decoration: none`.** There is no global anchor reset, so a `<Link className="btn …">` arrives underlined. Both `reading-history__empty-cta` and `reset-password__back` set it explicitly (as `_payment-result.scss` already did).

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
- Reader catalog is **static config** in `src/lib/readers.ts` (`READERS`, `READER_IDS`, `ReaderId` type, `DEFAULT_READER`). Each entry has `id`, `aura` (currently all use `var(--text-color)` — no per-reader colors without approval), and `avatar` path.
- **Reader portrait art** lives at `public/readers/{vespera,crow,reginald}.webp` (exists; added 19 Apr 2026). **Generated with fal.ai** (https://fal.ai — multi-model image playground). Exact model + prompt per portrait are recoverable from the fal.ai request history if regeneration is needed; a `FLux` byte fragment in `reginald.webp` suggests a FLUX model was used, but this is unconfirmed (fal is multi-model). Source PNGs were converted to WebP, which stripped all provenance metadata — do NOT rely on the deployed files to identify the tool.
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
- **Responsive layout (breakpoint = `md`/768px):** at `md+` the cards sit inline in a row and the summon pane (bio + Summon) renders inline in the modal flow. Below `md` the cards stack single-column and the summon pane becomes a **fixed bottom sheet**.
- **Mobile bottom sheet — portaled to `<body>`.** The sheet MUST be portaled out of the modal (`createPortal(summonPane, document.body)`), NOT rendered inside `.modal__content`. That element has `backdrop-filter: blur(50px)`, which establishes a containing block for `position: fixed` descendants — so a fixed sheet left inside it scrolls with the cards and lands at different Y positions per reader instead of nailing to the viewport (same reason `Modal.tsx` portals). `ReaderSelection` picks inline-vs-portal via an `isSheet` state from `matchMedia("(max-width: 48em)")`. The sheet is `z-index: 110` (above `.modal` 100) since it's now a `body` sibling of the modal. It slides up (`data-visible`) when a reader is picked; a `scroll` listener on `.modal__content` (gated to `isSheet`) sets `sheetDismissed` to slide it away on scroll; tapping a reader clears it and re-shows. `respond-below(md)` reserves `padding-bottom` on the deck so the last card scrolls clear of the sheet.
- **Anti-reflow "overlap stack" (both axes).** Reader bios differ in length and summon labels differ in width, which made the centered modal jump when switching readers. Fix: render **all** bios (+ placeholder) in one CSS-grid cell (`&__bio-stack > * { grid-area: 1/1 }`) and **all** summon labels in another (`&__summon-label-stack`), showing only the active one via `opacity`. The container then always reserves the **tallest bio / widest label**, so height (vertical) and button width (horizontal) stay constant across readers — locale-proof, no magic numbers. Inactive entries carry `aria-hidden` so the accessible name stays the active label only.
- UserProfile shows current reader name with a "→ Choose Your Reader" button that closes the profile modal and opens the reader selection modal. Both `page.tsx` and `PageShell.tsx` wire up the `ReaderSelectionModal`.
- **All three locales have reader translations.** English, Norwegian, and Russian `readings.json` files all have a `readers` block and corresponding UI keys in `ui.json`. Russian reader and UI translations need polish — quality is rough.
- **Adding a new reader:** Add an entry to `READERS` in `src/lib/readers.ts`, add the matching block to `messages/{locale}/readings.json` under `"readers.{newId}"` (same structure as existing readers: displayName, title, tagline, bio, intros, bridges, futureBridges, closings, pastPrefix, presentPrefix, futurePrefix). The selection UI and reading generator pick it up automatically.

## Header

- `Header.tsx` renders `Logo` + `MainMenu` + **one** trailing slot.
- **That slot is auth-dependent (2026-08-02):** signed-out visitors get `<LanguageSwitcher />` (the globe); signed-in users get `<HeaderAvatar />` — a 32px circle showing `session.user.image`, or the first letter of their name when they haven't uploaded one. It links to `/profile`, which is where a signed-in user changes language.
- **Gate on `session?.user`, never on `status`.** `LanguageSwitcher` owns a modal, and a NextAuth `update()` flips `status` to `"loading"` mid-flight — a status gate would unmount it and close the open modal (the same bug documented under Gotchas). Consequence: on a cold load a signed-in user sees the globe for a beat before the avatar replaces it. That flicker is the accepted cost of not tearing down modals.
- `.header-avatar` carries intrinsic styles only (size, border, radius) — the header owns placement.

## User Profile

- Standalone page at `/[locale]/profile` (`ProfilePageClient` → `PageShell` → `UserProfile`). `PageShell` provides the ambient `LoginContext` and the login modal; unauthenticated visitors are redirected to `/`.
- **Field-row + edit-icon pattern:** every field is a `.user-profile__field--row` (label left, value + pencil `__edit-icon` right). The pencil opens the relevant editor. Rows: Avatar, Name, Email (no editor), Current plan, Reading Credits, Renewal, Deck, Reader, Ledger of Fates, Language, Password.
- **Conditional rows** — not every row shows for every user:
  - **Renewal** only for MONTHLY/YEARLY.
  - **Reading Credits ("Fates Remaining")** is **hidden** for an active MONTHLY/YEARLY tier (2026-08-02) — subscription readings are unlimited and never decrement the balance, so a count there is noise. A lapsed subscriber sees their untouched balance again.
  - **Ledger of Fates** swaps its affordance instead of hiding: subscribers get the value + **eye** icon (`src/assets/svg/eye.svg`) routing to `/history`; everyone else gets a `.user-profile__row-cta` button reading `ui.beginInitiation` that opens `SubscriptionModal`. Reuse `beginInitiation` for any future paywall CTA rather than adding a new "upgrade" string — the locked readers already say it.
  - The subscriber test is `isSubscriber` in `UserProfile`, which mirrors the server's `isActiveTier()` (MONTHLY/YEARLY **and** `expiresAt` in the future). Don't test `planId` alone.
  - **Station (`profilePlan`) row.** Active paid tier → `"{plan} · {expiry}"` + the auto-renew toggle + pencil. Lapsed (`isLapsed` = paid `planId` that is no longer active — expired but not yet downgraded by the cron) → **only** the paywall CTA; the dead tier name is dropped. The separate **Renewal** row was folded into this one (2026-08-02) so the expiry date isn't shown twice — its cancel/resume toggle moved here, and must stay reachable: cancelling a subscription can't require contacting support.
  - **One paywall CTA label, everywhere.** Every control that opens `SubscriptionModal` uses `ui.beginInitiation`. The Station row briefly had its own "Renew" string beside the Ledger row's "Begin Initiation" — two buttons, one behaviour, two labels. If you add another paywall entry point, reuse `beginInitiation`; don't invent a third string. Without the lapsed branch the page contradicts itself: `planId` still says Monthly while every entitlement gate treats the user as free. The label is deliberately one short word so the row never wraps — `--row` sets `flex-wrap: wrap`, so long themed labels push the value onto a second line. Any future plan-dependent UI must decide which of the two it follows — entitlement (`isSubscriber`) or the raw enum — and never mix them on one screen.
- **`.user-profile__row-cta`** is the inline row-scale button (bordered, uppercase, 0.7rem) — use it when a row's action is a CTA rather than an icon. A full-width `.btn` is wrong at row scale.
- **Editors are modals** (all portal to `document.body` via `Modal`):
  - **Name** and **Password** → small modals built with the shared **auth-form styles** (`.form` / `.form__input-block` / `.form__label` / `.form__input`, full-width `.btn form__btn` Save + bordered `form__btn--google` Cancel). They deliberately reuse the login modal's look; there is no bespoke `.user-profile__edit*` styling anymore. `.form__success` (green, mirrors `.form__error`) was added for the password-updated message.
  - **Language** → the `.options-modal` radio list + Save (same component the header `LanguageSwitcher` uses).
  - **Deck** → `<DeckSelector inModal />`; **Reader** → `<ReaderSelectionModal>`; **Current plan / Reading Credits / reader upgrade** → `<SubscriptionModal>` (see Subscription §).
- Data load on mount: `GET /api/user/{plan,reader,deck,password-status}`. Plan/credits/renewal come from `GET /api/user/plan` (`getSubscriptionStatus`). Auto-renew toggle → `PATCH /api/user/subscription`.
- **Gotcha:** because these modals portal outside `.user-profile`, any style they use must be a top-level selector, not nested under `.user-profile` — that's why the shared form controls live in `_form.scss` and `.options-modal` is a top-level block in `_user-profile.scss`.
- **Gotcha — display NextAuth-backed preferences from the session, not a mount-only fetch.** When an editor modal persists a preference via `update({ preferredX })`, the profile field must read that value from `session.user.preferredX` (reactive — re-renders on `update()`) so the change shows immediately, the same way Language reads `useLocale()`. Both Reader and Deck were previously loaded once into local state via `GET /api/user/{reader,deck}` on mount, so changing them from their modals left the profile showing the stale value until a reload (fixed 2026-07-05 — they now read `session.user.preferredReader` / `session.user.preferredDeck`). Keep any future preference field on this session-reactive pattern.

## Legal Pages (Privacy / Terms / Cookie Policy / Refund)

- **Routes:** `/privacy`, `/terms`, `/cookie-policy`, `/refund` — **unprefixed**, NOT under `[locale]`. Live at `src/app/{privacy,terms,cookie-policy,refund}/`. (Refund Policy added 2026-06-25, same self-contained pattern.)
- **File layout per page (3 files each):**
  - `page.tsx` — server component, exports `metadata`, delegates to the Content component.
  - `layout.tsx` — self-contained root layout. Renders its own `<html lang="en">` + `<body>`, loads Raleway, wraps children in `NextIntlClientProvider` preloaded with English JSON only, renders `<CookieBanner />`.
  - `XxxContent.tsx` — `"use client"`, renders `<PageShell>` wrapping `<main class="legal-page container"><article class="legal-page__content">…</article></main>`. Content is a raw HTML string (Termly export) with **both** the leading `<style>` block AND inline `style="..."` attributes stripped at module load, then injected via the split-string workaround (see Gotchas). **Gotcha:** the Termly `<style>` block hardcodes `color:#000` (black text) — on the dark theme it makes headings invisible, so it MUST be stripped, not just the inline styles. Strip line: `RAW.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/\s*style="[^"]*"/g, "")`.
- **Middleware bypass:** `src/middleware.ts` short-circuits these three paths with `NextResponse.next()` so the next-intl middleware doesn't try to redirect them to `/{locale}/...`. Also: if someone hits `/{locale}/privacy` etc., middleware redirects back to the unprefixed path.
- **Styles:** `src/assets/scss/blocks/_legal-page.scss` (minimal — line-height + padding).
- **Why this pattern:** These are large static HTML blobs (Termly exports). Translating them is high-effort, low-value; the content is legally fine in English globally. The unprefixed URL also matches what's referenced in the policies themselves (e.g., "https://theveil.app/cookie-policy").
- **Email contacts in legal pages** route by purpose (see Contact Form § for the full map): `privacy@nothingweird.agency` for privacy/DSAR/cookies, `legal@nothingweird.agency` for ToS/IP/copyright/subscription cancellation. All at `nothingweird.agency`.
- **Updating a legal page** (fresh Termly export): replace ONLY the raw-HTML template-literal constant (`PRIVACY_HTML_RAW` etc.) in `{Page}Content.tsx`; leave `"use client"`, the `PageShell` import, the strip / `HTML_PROP` lines, and the exported component untouched. Escape backticks and `${` in the pasted HTML, then `npx tsc --noEmit`. A big export can exceed the single-Write limit — write a `@@BODY@@` placeholder first, then grow it with Edits. As of 2026-06-16, privacy + cookie-policy have fresh exports; **terms was not yet updated** (waiting on its export — don't touch it until provided).
- **Legal entity** (referenced in policy bodies): Olena Christensen, Individual Entrepreneur (FOP), dba "Nothing Weird", Voskresenskyi Ave 24A/14, Kyiv 02125, Ukraine. Analytics: Google Analytics. Payments: monobank / Plata by mono.

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
- **SSR guard (required):** the initializer's FIRST line is `if (typeof window === "undefined") return false;`. Server modules persist across requests, so without this the flag is read/mutated on the server, sticks at `true`, and desyncs server vs. client HTML → hydration mismatch ("switch to client rendering"). The server must always render the intro-plays state to match a fresh client load. Keep this guard on any copy of the pattern.
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

**Key:** This reading-flow loader uses the ouroboros SVG directly (`import LoaderSvg from "@/assets/svg/ouroboros.svg"`), NOT the `Loader` component. Separately, `OfferBlock`'s initial `!isLoaded` state DOES render the full-screen `<Loader />` component (`.loader`, centered `position: fixed`, z-index 70) — restored after the SEO refactor (commit `4d2e5b4`) had replaced it with a bare unstyled `<div>{t("loading")}</div>` that rendered off-screen-left.

### Deck card glow

The deck card on the main page has a `glowing` effect (conic-gradient `::before` pseudo-element). It uses a custom `glowPulseDeck` keyframe scaled to 0.8 (defined in `_offer-block.scss`). Glow is active when the deck is idle (`!isDeckShaking && !state.isCardsModalOpen`).
