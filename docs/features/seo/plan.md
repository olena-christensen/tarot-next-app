# SEO Feature — Implementation Plan

**Status:** Planned
**Created:** 2026-04-19
**Locales:** `en` (default), `no`, `uk`, `tr`, `ru`

---

## Goals

- Make the app fully indexable by Google/Bing across all 5 locales.
- Ship correct hreflang so each locale ranks in its own market.
- Get rich social previews (Open Graph + Twitter).
- Prepare per-content pages (cards, readers, decks) for long-tail organic traffic.

## Non-goals

- Paid SEO, link building, off-page work.
- Analytics (tracked separately).
- CMS/blog — evaluate after Phase 6.

---

## Audit findings (baseline)

**In place**
- `<html lang={locale}>` set dynamically in `[locale]/layout.tsx`.
- `next/font` for Raleway (good CLS).
- `h1` on subscription, decks, profile, home (OfferBlock).
- Terms & Privacy already use `generateMetadata`.

**Critical gaps**
1. `src/app/[locale]/page.tsx` is `"use client"` and renders `<Loader />` until hydration — bots see a spinner.
2. No `metadataBase` → absolute URLs broken, Next.js warns on every build.
3. No hreflang / `alternates.languages` for 5 locales.
4. No `robots.ts`.
5. No `sitemap.ts`.
6. No Open Graph / Twitter Card metadata.
7. No per-page metadata on `/`, `/decks`, `/subscription`, `/profile` — all inherit the bare `"Tarot"` title from root layout.
8. No JSON-LD (Organization, WebApplication).
9. No canonical URLs.
10. Only `logo.svg` as icon — missing `favicon.ico`, `apple-touch-icon`, web manifest.
11. Empty `alt=""` in `OfferBlock.tsx:158` and `ReaderSelection.tsx:93`; generic `"Tarot Card"` alt repeated 78× in `AnimatedCard.tsx`.
12. `/profile` should be `noindex` (private).
13. Stray `public/Cards/Card3 (1).png` with space in filename.
14. No `not-found.tsx` (custom 404).
15. `ui.json` has no `seo` namespace for metaTitle/metaDescription across pages.

---

## Phase 1 — Foundation (highest ROI)

Goal: make Google see the home page correctly with proper metadata and hreflang.

- [ ] Add `NEXT_PUBLIC_SITE_URL` to `.env.example` and document in CLAUDE.md.
- [ ] Add `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!)` in `src/app/layout.tsx`.
- [ ] Refactor `src/app/[locale]/page.tsx`:
  - Remove `"use client"` from the page file.
  - Extract modal/loader logic into `HomePageClient.tsx` (client component).
  - Server page just calls `unstable_setRequestLocale(locale)` and renders `<HomePageClient />`.
  - Kill the full-screen `<Loader />`-until-hydrated pattern — render `<Header/>`, `<OfferBlock/>`, `<Tarot/>` immediately.
- [ ] Add `generateMetadata` to `src/app/[locale]/layout.tsx`:
  - Per-locale `title` (template pattern: `"%s | Tarot"` with default), `description`, `keywords`.
  - `alternates.canonical` = current locale path.
  - `alternates.languages` = every locale (`en-US`, `nb-NO`, `uk-UA`, `tr-TR`, `ru-RU`) + `x-default`.
- [ ] Add `src/app/robots.ts`:
  - Allow all.
  - Disallow `/api/*`, `/*/profile`.
  - Sitemap URL.
- [ ] Add `src/app/sitemap.ts`:
  - Cross-product of locales × public routes (`/`, `/decks`, `/subscription`, `/terms`, `/privacy`).
  - Include `alternates.languages` per entry.
- [ ] Add new `messages/{locale}/ui.json` → `seo` namespace with `home.metaTitle`, `home.metaDescription`, `home.keywords` in all 5 locales.

**Exit criteria:** View-source on `/` shows real HTML + proper `<title>`, `<meta description>`, `<link rel="alternate" hreflang>` tags. `/robots.txt` and `/sitemap.xml` resolve in dev.

---

## Phase 2 — Per-page metadata

- [ ] Convert `src/app/[locale]/decks/page.tsx` to server component:
  - Move `"use client"` bits into a `DecksPageClient.tsx`.
  - Add `generateMetadata` using `seo.decks.*` keys.
- [ ] Convert `src/app/[locale]/subscription/page.tsx` same way (`seo.subscription.*`).
- [ ] Convert `src/app/[locale]/profile/page.tsx` same way:
  - `generateMetadata` returns `{ robots: { index: false, follow: false } }`.
- [ ] Add `seo.decks.*`, `seo.subscription.*`, `seo.profile.*` keys to every `ui.json`.

**Exit criteria:** Each route has a unique `<title>` and meta description per locale; `/profile` is `noindex`.

---

## Phase 3 — Social + structured data

- [ ] Add OG + Twitter fields to `[locale]/layout.tsx` `generateMetadata`:
  - `openGraph: { type: "website", locale, url, title, description, images: [ogImage], siteName }`.
  - `twitter: { card: "summary_large_image", title, description, images: [ogImage] }`.
- [ ] Produce `public/og-image.png` (1200×630) — brand artwork, reuse moon/card/logo elements from existing assets.
- [ ] Optionally per-locale OG variants: `public/og-image-{locale}.png`.
- [ ] Inject JSON-LD in `[locale]/layout.tsx`:
  - `Organization` (name, url, logo, sameAs if social links exist).
  - `WebApplication` (name, url, applicationCategory: "LifestyleApplication", offers if pricing is public).
- [ ] (Optional) `FAQPage` JSON-LD if/when we add FAQ copy.

**Exit criteria:** Facebook/Twitter sharing debuggers show rich previews; schema.org validator passes.

---

## Phase 4 — Icons & manifest

- [ ] Generate icon set from `logo.svg`:
  - `public/favicon.ico` (32×32 multi-res).
  - `public/icon-192.png`, `public/icon-512.png`.
  - `public/apple-touch-icon.png` (180×180).
- [ ] Add `public/site.webmanifest` (name, short_name, icons, start_url, theme_color, background_color, display: "standalone").
- [ ] Wire via Next.js file-convention icons (`src/app/icon.png`, `src/app/apple-icon.png`) OR `metadata.icons` + `metadata.manifest`.
- [ ] Add `themeColor` and `viewport` to metadata.

**Exit criteria:** Lighthouse "installable" check passes; PWA icons show in mobile add-to-home-screen.

---

## Phase 5 — Content & a11y hygiene

- [ ] Fix `alt=""` on `OfferBlock.tsx:158` (reader avatar — use reader display name).
- [ ] Fix `alt=""` on `ReaderSelection.tsx:93` (same).
- [ ] Replace generic `alt="Tarot Card"` in `AnimatedCard.tsx` with `{cardName} — {deckName}` using translations.
- [ ] Rename/delete `public/Cards/Card3 (1).png` (unused? confirm first).
- [ ] Add `src/app/[locale]/not-found.tsx` with translated 404 copy + link back home.
- [ ] Heading hierarchy sweep: ensure one `h1` per page, demote duplicate `title` elements if any.

**Exit criteria:** axe/Lighthouse a11y shows no missing-alt issues; 404 pages render correctly.

---

## Phase 6 — Content depth (long-term organic traffic)

Tarot apps rank on keyword-heavy content. This is where the traffic actually comes from. Scope separately — estimate 1–2 weeks of work.

- [ ] `/[locale]/cards/[cardId]` — per-card pages (78 cards × 5 locales = 390 pages):
  - Pulls name + reading templates from `messages/{locale}/cards.json` + `readings.json`.
  - Server-rendered, unique title/description/canonical per card.
  - Schema.org `Article` JSON-LD.
- [ ] `/[locale]/readers/[readerId]` — per-reader pages (3 × 5 = 15 pages):
  - Uses `readers.{id}` translation block already in `readings.json`.
- [ ] `/[locale]/decks/[deckId]` — per-deck pages (3 × 5 = 15 pages):
  - Deck intro, sample cards, "pick this deck" CTA.
- [ ] Internal linking: main page → readers, decks index → each deck, profile deck picker → each deck.
- [ ] Update `sitemap.ts` to include all new routes.

**Exit criteria:** 420+ indexable pages with unique content; internal link graph is connected.

---

## Phase 7 — Verification

- [ ] Add Search Console / Bing Webmaster verification meta tags (via `metadata.verification`).
- [ ] Submit sitemap to both.
- [ ] Run Lighthouse (Mobile) — target SEO ≥ 95 after Phase 1–2, ≥ 100 after Phase 5.
- [ ] Check Google Rich Results Test for JSON-LD validity.
- [ ] `site:tarot-app-domain.com` query after deploy to confirm indexing (wait 1–2 weeks).

---

## File changes overview

**New files**
- `docs/features/seo/plan.md` (this file)
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/[locale]/not-found.tsx`
- `src/app/[locale]/HomePageClient.tsx`
- `src/app/[locale]/decks/DecksPageClient.tsx`
- `src/app/[locale]/subscription/SubscriptionPageClient.tsx`
- `src/app/[locale]/profile/ProfilePageClient.tsx`
- `src/lib/seo.ts` (helpers: `buildAlternates(path)`, `buildOpenGraph(locale, ...)`, `getSiteUrl()`)
- `public/og-image.png`
- `public/favicon.ico`, `public/apple-touch-icon.png`, icon PNGs
- `public/site.webmanifest`
- (Phase 6) `src/app/[locale]/cards/[cardId]/page.tsx` + `readers/[readerId]` + `decks/[deckId]`

**Modified files**
- `src/app/layout.tsx` — `metadataBase`, viewport, themeColor.
- `src/app/[locale]/layout.tsx` — `generateMetadata`, JSON-LD injection.
- `src/app/[locale]/page.tsx` — strip client code.
- `src/app/[locale]/decks/page.tsx` — strip client code.
- `src/app/[locale]/subscription/page.tsx` — strip client code.
- `src/app/[locale]/profile/page.tsx` — strip client code, add `noindex`.
- `src/components/OfferBlock.tsx`, `ReaderSelection.tsx`, `AnimatedCard.tsx` — alt fixes.
- `messages/{en,no,uk,tr,ru}/ui.json` — add `seo` namespace.
- `.env.example` — `NEXT_PUBLIC_SITE_URL`.
- `CLAUDE.md` — document `NEXT_PUBLIC_SITE_URL`, SEO conventions.

---

## Open questions

1. What's the production domain? (Needed for `NEXT_PUBLIC_SITE_URL`, sitemap, canonical URLs.)
2. Do we have social accounts to link via `sameAs` in Organization JSON-LD?
3. Any brand guidelines for the 1200×630 OG image, or reuse existing hand/moon artwork?
4. Phase 6 (per-card pages) — green-light now or defer until Phase 1–5 ship?
