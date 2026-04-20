# SEO Feature — Implementation Plan

**Status:** Phases 1–5 complete. Phase 6 (content depth) + Phase 7 (verification) remain.
**Created:** 2026-04-19
**Last updated:** 2026-04-20
**Production domain:** `https://theveil.app` (bought via Vercel)
**Locales:** `en` (default), `no`, `uk`, `tr`, `ru`

---

## Decisions made

- **Brand / domain:** `theveil.app` — purchased on Vercel. Domain being cryptic is fine; title tags, OG previews, and landing copy teach users what the app is (Co–Star, Sanctuary, Labyrinthos all rank with non-descriptive names).
- **Production env var:** `NEXT_PUBLIC_SITE_URL=https://theveil.app` set on Vercel Production.
- **Image generation service:** fal.ai (same tool used for reader avatars).
- **Logo + OG image:** not yet done. Tomorrow's starting point.

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

## Audit findings (baseline — before any work)

**In place**
- `<html lang={locale}>` set dynamically in `[locale]/layout.tsx`.
- `next/font` for Raleway (good CLS).
- `h1` on subscription, decks, profile, home (OfferBlock).
- Terms & Privacy already use `generateMetadata`.

**Critical gaps addressed in Phase 1 & 2**
1. ~~`src/app/[locale]/page.tsx` rendered `<Loader />` until hydration~~
2. ~~No `metadataBase`~~
3. ~~No hreflang~~
4. ~~No `robots.ts`~~
5. ~~No `sitemap.ts`~~
6. ~~No Open Graph / Twitter Card metadata~~
7. ~~No per-page metadata on `/`, `/decks`, `/subscription`, `/profile`~~
12. ~~`/profile` not `noindex`~~

**Remaining (Phase 3+)**
8. No JSON-LD structured data
9. No OG image asset
10. Only `logo.svg` — no `favicon.ico`, `apple-touch-icon`, web manifest
11. Empty `alt=""` in `OfferBlock.tsx:158` and `ReaderSelection.tsx:93`; generic `"Tarot Card"` alt 78× in `AnimatedCard.tsx`
13. Stray `public/Cards/Card3 (1).png` filename with space
14. No `not-found.tsx`
15. ~~No `seo` namespace in translations~~ (done — `messages/{locale}/seo.json`)

---

## ✅ Phase 1 — Foundation (COMPLETE)

Verified live on `https://theveil.app`:
- `/robots.txt` — allows all, disallows `/api/` and `/*/profile`, references sitemap
- `/sitemap.xml` — 25 URLs (5 locales × 5 public routes), each with full hreflang alternates
- `/en` page — proper title, description, canonical, hreflang set (en, nb-NO, uk-UA, tr-TR, ru-RU, x-default), OG + Twitter tags

**Files added/changed:**
- `.env.example` — added `NEXT_PUBLIC_SITE_URL`
- `src/lib/seo.ts` — `getSiteUrl`, `buildAlternates`, `HREFLANG_MAP`, `PUBLIC_ROUTES`, `absoluteUrl`, `localizedPath`
- `src/app/layout.tsx` — `metadataBase`
- `src/app/[locale]/layout.tsx` — `generateMetadata` (canonical, hreflang, OG, Twitter)
- `src/app/[locale]/page.tsx` — converted to server component
- `src/app/[locale]/HomePageClient.tsx` — extracted client state (killed `<Loader />`-until-hydrated pattern)
- `src/app/robots.ts`, `src/app/sitemap.ts`
- `src/i18n/request.ts` — loads new `seo.json` namespace
- `messages/{en,no,uk,tr,ru}/seo.json` — translation keys for all page metadata

---

## ✅ Phase 2 — Per-page metadata (COMPLETE)

Verified live on `https://theveil.app`:
| Route | Title | Canonical | Robots | Hreflang |
|---|---|---|---|---|
| `/en/decks` | Choose Your Tarot Deck \| Tarot | `/en/decks` | index | full set |
| `/no/decks` | Velg din tarotkortstokk \| Tarot | `/no/decks` | index | full set |
| `/en/subscription` | Subscription Plans \| Tarot | `/en/subscription` | index | full set |
| `/en/profile` | Your Mystic Profile \| Tarot | `/en/profile` | **noindex, nofollow** | none (correct) |

**Files changed:**
- `src/app/[locale]/decks/page.tsx` — server component + `generateMetadata`
- `src/app/[locale]/subscription/page.tsx` — server component + `generateMetadata`
- `src/app/[locale]/profile/page.tsx` — server component + `generateMetadata` with `noindex, nofollow`
- `src/app/[locale]/profile/ProfilePageClient.tsx` — extracted client logic

---

## ✅ Phase 3a/b/c — Brand assets + social metadata (COMPLETE)

**3a. Logo** — generated via fal.ai (Flux Pro), cleaned with a sharp threshold script (distance-to-gold alpha mask), live as `/logo-2.png` (three-card fan in `#fae1a3` art-nouveau line art on real transparency). Header + favicon use it.

**3b. OG image** — generated via fal.ai (Flux Pro, 1200×630), composed with sharp to overlay "The Veil" + "tarot reading" text in the dark left-half, saved at `public/og-image.png`.

**3c. OG + Twitter metadata** — `openGraph.images` and `twitter.images` wired into `generateMetadata` in `[locale]/layout.tsx`. `metadataBase` resolves the relative URL to `https://theveil.app/og-image.png`. `siteName` updated to `"The Veil"` across all 5 locales' `seo.json`.

**Files added/changed this round:**
- `public/logo-2.png`, `public/og-image.png`
- `src/components/Logo.tsx` — swapped from SVGR import to `next/image` on `/logo-2.png`
- `src/assets/scss/blocks/_logo.scss` — replaced `svg path` fill rule with `img { object-fit: contain }`
- `src/app/[locale]/layout.tsx` — added `openGraph.images` + `twitter.images`
- `messages/{en,no,ru,tr,uk}/seo.json` — `siteName: "The Veil"`
- `package.json` — added `sharp@^0.33` as devDep (image post-processing)

**Orphans ready to delete** (kept as backups from the cleanup passes):
- `public/logo-old.svg`, `src/assets/svg/logo.svg` (pre-rebrand)
- `public/logo-generated.png`, `public/logo-1-generated.png`, `public/logo-2-generated.jpg`, `public/fav-icon-generated.png` (raw fal.ai outputs)
- `public/og-raw.png`, `public/logo.png`, `public/logo-1.png` (unused logo variants)

---

## ✅ Phase 3d — JSON-LD structured data (COMPLETE)

- `src/lib/seo.ts` — added `buildJsonLd({ locale, siteName, description })` helper emitting an `@graph` with:
  - `Organization` — name, url, logo (absolute `/logo-2.png`), stable `@id` for cross-ref
  - `WebApplication` — localized url, description, `applicationCategory: "LifestyleApplication"`, `operatingSystem: "Web"`, `inLanguage` from `HREFLANG_MAP`, image (absolute `/og-image.png`), `publisher` ref to Organization
- `src/app/[locale]/layout.tsx` — JSON-LD injected as `<script type="application/ld+json">` at top of `<body>`, `<` escaped to `\u003c` for XSS hardening.
- **Skipped intentionally:** `sameAs` (no socials yet), `Offer`/pricing (out of scope until payments wired).

**Verify after deploy:** https://search.google.com/test/rich-results with `https://theveil.app/en`.

---

## ✅ Phase 4 — Icons & manifest (COMPLETE)

Next.js 14 auto-picks up `app/icon.*`, `app/apple-icon.*`, `app/favicon.ico`, `app/manifest.ts` — no manual `metadata.icons` / `metadata.manifest` needed.

- `src/app/icon.png` — 200×200 transparent (from cleaned fal.ai output)
- `src/app/apple-icon.png` — 180×180 on `#090909` solid bg
- `src/app/favicon.ico` — multi-res legacy fallback (from realfavicongenerator.net)
- `public/web-app-manifest-192x192.png`, `public/web-app-manifest-512x512.png` — PWA install icons
- `src/app/manifest.ts` — PWA metadata (name "The Veil", `theme_color` / `background_color` = `#090909`, `display: "standalone"`, both icons marked `maskable`)
- `src/app/layout.tsx` — added `export const viewport` with `themeColor: "#090909"`, `width: "device-width"`, `initialScale: 1`

---

## ✅ Phase 5 — Content & a11y hygiene (COMPLETE)

- `OfferBlock.tsx:158` — reader avatar alt now uses translated reader `displayName` (parent stays `aria-hidden="true"` to avoid double-announcement; alt still helps Google image search).
- `ReaderSelection.tsx:93` — same treatment, reader `displayName` via `tReader`.
- `AnimatedCard.tsx` — added optional `frontAlt` / `backAlt` props (defaults: `"Tarot card back"` / `"Tarot card"`). `Tarot.tsx` passes the chosen card's translated name as `backAlt`; the deck card on `OfferBlock` uses the generic defaults (it's the deck-back visual, not a specific card).
- `public/Cards/Card3 (1).png` — deleted (was unused, and the stray space in the filename was a URL-encoding hazard).
- `src/app/[locale]/not-found.tsx` — server component using `useTranslations("ui")`, wrapped in `PageShell`, with a `<Link>` back to `/`. Copy lives under `ui.notFound.{title,description,backHome}` in all 5 locales' `ui.json`. Styled via new `src/assets/scss/blocks/_not-found.scss`.
- Heading hierarchy audit — **already clean**: every page has a single `<h1>` (`OfferBlock`, `DeckSelector`, `SubscriptionPlans`, `ProfilePageClient`, `TermsContent`, `PrivacyContent`, and now `NotFound`). Modals (`Login`, `Modal`, reader cards, deck cards) correctly use `<h2>` as subsections. No demotions needed.

---

## Phase 6 — Content depth (long-term organic traffic)

Per-content pages where most tarot-app organic traffic comes from. Scope separately — 1–2 weeks.

- `/[locale]/cards/[cardId]` — 78 cards × 5 locales = 390 pages
- `/[locale]/readers/[readerId]` — 3 × 5 = 15 pages
- `/[locale]/decks/[deckId]` — 3 × 5 = 15 pages
- Internal linking between all three
- Extend `sitemap.ts` to include new routes

---

## Phase 7 — Verification & launch

- Google Search Console — add `theveil.app` property, verify via DNS TXT, submit `https://theveil.app/sitemap.xml`.
- Bing Webmaster Tools — same.
- Run Lighthouse (Mobile) — target SEO ≥ 95 after Phase 1–2, ≥ 100 after Phase 5.
- Google Rich Results Test for JSON-LD validity.
- Facebook Sharing Debugger + Twitter Card Validator for OG image.
- `site:theveil.app` query 1–2 weeks after submitting sitemap.

---

## Notes for next session

Start here (two remaining phases, pick based on priority):
1. **Phase 7 (Verification & launch, short)** — deploy, submit sitemap to Google Search Console + Bing, run Lighthouse, validate JSON-LD with Rich Results Test, refresh OG caches on FB/LI/Twitter. Probably <1 day.
2. **Phase 6 (Content depth, 1–2 weeks)** — per-card / per-reader / per-deck pages for long-tail organic traffic. See phase 6 for scope.

**Still unresolved:**
- Social accounts for `Organization.sameAs` in JSON-LD — do we have any?
- Payment provider / pricing JSON-LD — out of scope until payments are wired (see CLAUDE.md).
