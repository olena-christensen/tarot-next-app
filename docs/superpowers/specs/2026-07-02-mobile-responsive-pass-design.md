# Mobile Responsive Pass — Design

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Scope:** Full pre-launch mobile-responsive fix across all pages/screens of "The Veil".

## Problem

Mobile (320–480px) is the #1 pre-launch blocker. A per-page audit (viewport 375px) found the breakage is **not** uniform — several pages already collapse correctly. It concentrates in a few reused primitives and missing infrastructure.

### Root causes
1. **`.mystic-btn` has no mobile override.** `_mystic-btn.scss:2-3`: `padding: 2rem 7rem` (224px horizontal) + `font-size: 26px` + a right-aligned `hand-with-cards.png` bg. The button needs ~300–360px before text. It is reused on the **3 most-broken surfaces**, so one rule fixes all three.
2. **No global `overflow-x` guard.** Nothing stops app-wide horizontal scroll; some wrappers (`.offer-block`, `.tarot-modal__inner`) merely *clip* overflow (hiding broken buttons), and surfaces without such a wrapper get real horizontal scroll.
3. **No shared breakpoint.** Every surface switches mobile↔desktop at a different width: 600 / 700 / 720 / 768 / 860 / 900 / 960px. No mixin in `_mixins.scss`.

### Ranked worst offenders
1. Tarot post-action buttons (`_tarot.scss:164-175` + `.mystic-btn`) — two 224px-padded buttons in one 375px row; only hidden by `overflow:hidden`.
2. Reader-selection modal (`ReaderSelection.tsx:128`, `_reader-selection.scss:144`, `_modal.scss:24`) — same button, but causes real horizontal scroll inside the `overflow-y:auto` modal.
3. Offer-block "Summon" (`OfferBlock.tsx:169-178`) — same button clipped behind bg image; plus a fragile absolutely-positioned 42px title (`_offer-block.scss:152`) that risks wrap/overflow in non-English locales.
4. Header (`_main-header.scss:1-8`, `MainMenu.tsx:20`) — `gap:2rem` + non-truncated welcome/name + no mobile layout.
5. Legal-page content (`_legal-page.scss` + injected Termly HTML) — no table/wide-element width guard → probable horizontal scroll from tables.
6. Footer overlay (`_main-footer.scss:6-13`) — `position:fixed; bottom:0` overlay can cover primary CTAs on short 100dvh screens.
7. User profile (`_user-profile.scss:2,11`) — cosmetic: no mobile padding/title reduction.

### Already correct (QA only, no fix expected)
Subscription, decks, contact form, base modal, payment result, and the tarot 3-card grid. All use an explicit `max-width` mobile breakpoint — the model to copy.

### Global foundation (verified OK)
- Viewport meta correct (`src/app/layout.tsx:11-15`, `width=device-width, initial-scale=1`, no max-scale lock).
- `.container` mobile-safe (`_container.scss`: base `width:100%; padding:0 1rem`; `max-width:1300px` only at `min-width:900`).
- Global `img { width:100%; height:auto }` (`_scafolding.scss`, `_normalize.scss`) — but overridden by fixed `!important` px on deck/tarot cards and `next/image` props, so it does not protect those.

## Approach

### Breakpoint infrastructure (`_mixins.scss`)
Single source of truth for breakpoint *values*, helpers for both directions:

```scss
@use "sass:map";
$breakpoints: (sm: 37.5em, md: 48em, lg: 56.25em);   // 600 / 768 / 900px

@mixin respond-below($bp) { @media (max-width: map.get($breakpoints, $bp)) { @content } }
@mixin respond-above($bp) { @media (min-width: map.get($breakpoints, $bp)) { @content } }
```

**Decision — unify the values, keep each file's direction.** The codebase is genuinely mixed: offer-block/tarot/header are mobile-first (base = mobile, `min-width:900` adds desktop); subscription/decks are desktop-first (base = desktop, `max-width:720` adds mobile). Fully converting the mobile-first files to one convention means rewriting their entire desktop + animation blocks — high risk, near-zero payoff, and it collides with the "don't touch animations blindly" rule. So we collapse the 7 raw pixel values to **3 named tokens** and each file keeps its existing direction, swapping raw px → token as we touch it. The stray 720→768 and 960→900 nudges land only on QA'd (already-correct) pages and are safe.

> Note on Sass `@import`: the project uses legacy `@import` in `style.scss`. `_mixins.scss` will need `@use "sass:map"` (or `map-get` legacy syntax) — use whichever the current Dart Sass setup compiles cleanly. Verify with `npm run build` before proceeding.

### Fixes (execution order)
1. **`.mystic-btn` mobile** (`_mystic-btn.scss`) — `respond-below(sm)`: padding `2rem 7rem` → ~`1rem 1.75rem`, font 26 → 16px, constrain the `hand-with-cards` bg so the label is never occluded. Fixes offenders ①②③.
2. **Global overflow-x net** (`_scafolding.scss`) — `overflow-x: hidden` on `body`, applied *after* the real fixes as belt-and-suspenders (not the primary mechanism). Must not break any `position: sticky`/`fixed` behavior — verify header/footer/language-switcher still work.
3. **Tarot post-actions** (`_tarot.scss`) — verify the two buttons fit after #1; if still tight at 320px, stack to a column (`flex-direction: column`) via `respond-below(sm)`.
4. **Reader-selection modal** (`_reader-selection.scss`) — confirm horizontal scroll gone after #1; tighten summon-pane padding at mobile.
5. **Offer-block title** (`_offer-block.scss`) — robustness for localized long words at 42px: clamp/reduce font on small screens, guard against wrapping into the moon. Do NOT alter the intro animation keyframes; only adjust font-size/wrapping within the existing mobile base.
6. **Header** (`_main-header.scss`, `MainMenu.tsx`) — reduce `gap` on mobile; truncate/ellipsize the welcome name (`.main-menu__link`) so a long name or localized string can't push the language switcher off-row.
7. **Legal tables** (`_legal-page.scss`) — add `.legal-page__content :is(table, pre, img) { max-width: 100% }` + `.legal-page__content table { display: block; overflow-x: auto }`.
8. **Footer overlay** (`_main-footer.scss`) — prevent the fixed-bottom `--overlay` variant from covering bottom CTAs on 100dvh screens (e.g. constrain to non-CTA screens, or make it non-blocking where CTAs sit).
9. **Profile cosmetics** (`_user-profile.scss`) — mobile padding `160px 0 100px` → ~`100px 0 80px`; title `2.5rem` step-down at `respond-below(sm)`.
10. **QA the correct 6** — visually verify subscription, decks, contact, base modal, payment result, tarot 3-card grid at 375px; no fixes expected.

### Verification
- Dev server on **:3001** (project runs there, not 3000).
- Drive with the **Playwright MCP** at a 375px viewport: load each page, screenshot, assert no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`) and CTAs fit.
- Check at least one non-English locale (e.g. `/no` or `/ru`) on the offer-block title.
- Run `npm run build` to confirm the new Sass mixin compiles.

## Constraints honored
- No new colors — existing CSS custom properties only.
- Never `opacity` for text color — use `--text-soft` / `--text-faint`.
- No wildcard (`*`) animation overrides; understand each keyframe/delay before touching.
- No layout (flex/width) baked into reusable components — parent owns layout.
- No git writes — user commits themselves.
- Always use Opus for any subagent.

## Out of scope
Other TODO UX items (intro-replay-once-per-session, subscription modal redesign, anon paywall message) — separate specs. This pass is responsive layout only.
