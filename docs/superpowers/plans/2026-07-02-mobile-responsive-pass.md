# Mobile Responsive Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page/screen of "The Veil" usable at 320–480px, fixing the concentrated breakage (reused `.mystic-btn`, missing overflow guard, inconsistent breakpoints) without disturbing the desktop layout or intro animations.

**Architecture:** Introduce a shared Sass breakpoint map + `respond-below`/`respond-above` mixins as the single source of truth for breakpoint values. Keep each file's existing mobile-first vs desktop-first direction; only swap raw px → named tokens and add the missing mobile rules. Fix the one un-responsive primitive (`.mystic-btn`) first — it resolves the 3 worst surfaces at once.

**Tech Stack:** SCSS (Dart Sass, legacy `@import` in `style.scss`), Next.js 14 App Router, React 18. Verification via dev server on :3001 + Playwright MCP at a 375px viewport.

## Global Constraints

- No new colors — existing CSS custom properties only (`_variables.scss`).
- Never use `opacity` to vary text color — use `--text-soft` (0.9) / `--text-faint` (0.7).
- No wildcard (`*`) selectors for animation/skip-intro overrides — list specific elements.
- No layout (flex/width) baked into reusable components — parent owns layout.
- Never hardcode color values — use `var(--xxx)`. For opacity variants use `rgba(250, 225, 163, 0.XX)`.
- **NEVER run git add/commit/stage** — the user commits themselves. No task includes a commit step.
- Always use Opus for any subagent.
- Dev server runs on **:3001**, not 3000.
- `style.css` / `style.css.map` are compiled artifacts — never edit; only edit `.scss` sources.

**Verification primitive (used by most tasks):** with the dev server on :3001, drive Playwright MCP: `browser_resize` to 375×812, `browser_navigate` to the page, `browser_take_screenshot`, then `browser_evaluate` `() => document.documentElement.scrollWidth <= window.innerWidth` — expect `true` (no horizontal scroll). Between tasks the user commits; do not commit for them.

---

### Task 1: Breakpoint infrastructure

**Files:**
- Modify: `src/assets/scss/_mixins.scss` (append at end)

**Interfaces:**
- Produces: `$breakpoints` map (`sm: 37.5em`, `md: 48em`, `lg: 56.25em` = 600/768/900px); mixins `respond-below($bp)` and `respond-above($bp)`. Later tasks call `@include respond-below(sm) { ... }` etc. `_mixins.scss` is imported by `style.scss` before all block partials, so the mixins are globally available.

- [ ] **Step 1: Add the map + mixins to `_mixins.scss`**

Append:

```scss
// ── Responsive breakpoints ──
// Single source of truth. Files keep their existing mobile-first (respond-above)
// or desktop-first (respond-below) direction; only the VALUE is centralized.
$breakpoints: (
  sm: 37.5em,   // 600px
  md: 48em,     // 768px
  lg: 56.25em,  // 900px
);

@mixin respond-below($bp) {
  @media (max-width: map-get($breakpoints, $bp)) {
    @content;
  }
}

@mixin respond-above($bp) {
  @media (min-width: map-get($breakpoints, $bp)) {
    @content;
  }
}
```

- [ ] **Step 2: Add a temporary probe to prove the mixin compiles**

Temporarily append to `_mixins.scss` a throwaway rule, then remove after build:

```scss
.__bp_probe { @include respond-below(sm) { color: var(--text-color); } }
```

- [ ] **Step 3: Build to verify Sass compiles**

Run: `npm run build`
Expected: build succeeds. If `map-get` emits a deprecation warning that's acceptable; a hard error is not — if it errors, switch to `@use "sass:map"` at the top of `_mixins.scss` and `map.get(...)`.

- [ ] **Step 4: Remove the probe**

Delete the `.__bp_probe` rule. (No git commit — user commits.)

---

### Task 2: `.mystic-btn` mobile override (fixes offenders ①②③)

**Files:**
- Modify: `src/assets/scss/blocks/_mystic-btn.scss`

**Interfaces:**
- Consumes: `respond-below(sm)` from Task 1.

Current desktop rule (`_mystic-btn.scss:2-3`): `padding: 2rem 7rem; font-size: 26px;` — 224px horizontal padding overflows a 375px row.

- [ ] **Step 1: Capture the broken state (before)**

Dev server on :3001. Playwright: resize 375×812, navigate to `/en`, click "Summon" flow to reach the tarot post-actions (or open the reader-selection modal), screenshot. Confirm the two mystic buttons overflow / are clipped.

- [ ] **Step 2: Add the mobile override**

Inside `.mystic-btn { ... }`, after the base declarations (before or after `&:hover`), add:

```scss
  @include respond-below(sm) {
    padding: 1rem 1.75rem;
    font-size: 16px;
    background-size: auto 60%;   // keep the hand-cards art from eating the label
    background-position: right 0.5rem center;
  }
```

- [ ] **Step 3: Verify visually + no overflow**

Playwright at 375px on the same surfaces: screenshot; run the scrollWidth check → `true`. The label must be fully visible and not occluded by the bg image.

- [ ] **Step 4: Regression-check desktop**

Playwright resize 1280×800, navigate `/en`, screenshot — button unchanged from before (padding `2rem 7rem`, font 26px). (User commits.)

---

### Task 3: Tarot post-action buttons stack safely

**Files:**
- Modify: `src/assets/scss/blocks/_tarot.scss` (post-actions block ~`:164-175`)

**Interfaces:**
- Consumes: `respond-below(sm)`. Depends on Task 2 (button padding already reduced).

Context: `.tarot__post-actions` is a flex row, `gap: 1.5rem`, two children each `flex: 1 1 30%; min-width: 100px`. After Task 2 the buttons are far narrower, but at 320px two side-by-side may still be tight.

- [ ] **Step 1: Read the current post-actions rule**

Read `_tarot.scss` around lines 160–180 to confirm exact selector names (`.tarot__post-actions`, child button class).

- [ ] **Step 2: Add a mobile column fallback**

Within the post-actions selector, add:

```scss
  @include respond-below(sm) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
```

Only add this if Step 4 of Task 2 verification still showed tightness at 320px; if the row already fits cleanly at 375 and 320, prefer keeping the row and just reducing `gap` to `1rem` at `respond-below(sm)`. Decide from the screenshot evidence, not assumption.

- [ ] **Step 3: Verify at 375px AND 320px**

Playwright resize 320×568 and 375×812, reach post-actions, screenshot each, scrollWidth check → `true`, both buttons fully visible and tappable (min ~44px tall). (User commits.)

---

### Task 4: Global overflow-x safety net

**Files:**
- Modify: `src/assets/scss/global/_scafolding.scss` (`body` rule, lines 2-9)

**Interfaces:** none. Applied AFTER Tasks 2–3 so it's a net, not the primary fix.

- [ ] **Step 1: Add `overflow-x: hidden` to `body`**

In the existing `body { ... }` block, add `overflow-x: hidden;`.

- [ ] **Step 2: Verify sticky/fixed elements still work**

Playwright at 375px: the header (`position: absolute`), footer `--overlay` (`position: fixed`), and language-switcher dropdown (`position: absolute`) must still render correctly — navigate `/en`, open the language dropdown, screenshot. `overflow-x: hidden` on `body` (not `html`) must not clip the fixed footer or the dropdown.

- [ ] **Step 3: Full-app scroll sweep**

Playwright at 375px, scrollWidth check → `true` on `/en`, `/en/subscription`, `/en/decks`, `/en/contact`, `/en/profile`, `/privacy`. All `true`. (User commits.)

---

### Task 5: Reader-selection modal mobile

**Files:**
- Modify: `src/assets/scss/blocks/_reader-selection.scss` (summon pane ~`:144`; existing `@media (max-width: 860px)` at `:216`)

**Interfaces:** Consumes `respond-below`. The grid already collapses at 860px; the scroll came from the mystic-btn (fixed in Task 2).

- [ ] **Step 1: Verify Task 2 already killed the horizontal scroll**

Playwright at 375px: open reader-selection modal (main page → "Change your reader"), screenshot, scrollWidth check → `true`. If already clean, only do Step 2 for padding polish.

- [ ] **Step 2: Migrate the existing `max-width: 860px` query to a token + tighten summon-pane padding**

Change the existing `@media (max-width: 860px)` to `@include respond-below(lg)` (900px ≈ 860px; the reader grid `minmax(0,280px)*3` still needs ~900 to fit, so `lg` is the correct token — verify the 3→1 collapse still looks right at 900 and 375). Add inside a `respond-below(sm)` block on the summon pane: reduce its padding so the card content isn't cramped (read the current padding value first; reduce ~30%).

- [ ] **Step 3: Verify at 375px**

Screenshot, scrollWidth → `true`, single centered column, summon button fits. (User commits.)

---

### Task 6: Offer-block title robustness (localized)

**Files:**
- Modify: `src/assets/scss/blocks/_offer-block.scss` (`.offer-block__title` ~`:141-155`, base font `42px`)

**Interfaces:** Consumes `respond-below`. **Do NOT touch the intro `@keyframes` or animation-delay values** (skip-intro rule). Only adjust font-size / wrapping on the title element.

- [ ] **Step 1: Check the worst-case locale**

Playwright at 375px: navigate `/no` then `/ru` then `/uk`, screenshot the title each time. Confirm whether long words wrap into the moon / overflow.

- [ ] **Step 2: Clamp the title font on small screens**

On `.offer-block__title`, replace the mobile base `font-size: 42px` with a fluid clamp that never exceeds today's value:

```scss
  font-size: clamp(1.75rem, 9vw, 42px);
```

Keep `flex-wrap: wrap; gap: 1rem; padding: 0 1.2rem; width: 100%` as-is. This shrinks only where 42px would overflow; at ≥~467px it stays 42px (unchanged desktop-adjacent look). Confirm the `min-width:900` desktop block (100px) is untouched.

- [ ] **Step 3: Re-verify all four locales**

Playwright at 375px on `/en`, `/no`, `/ru`, `/uk`: title fits, does not overlap the moon, scrollWidth → `true`. Desktop (1280px) title still 100px. (User commits.)

---

### Task 7: Header mobile layout

**Files:**
- Modify: `src/assets/scss/blocks/_main-header.scss`
- Read: `src/components/MainMenu.tsx` (welcome link class `.main-menu__link`)

**Interfaces:** Consumes `respond-below`. **Do NOT touch `@keyframes headerSlideIn` or the `skip-intro` rule.**

Current: `.main-header { display:flex; gap:2rem; }`, logo 80px mobile. Welcome link has no truncation → long name/localized string pushes the language switcher off-row.

- [ ] **Step 1: Confirm the crowding**

Playwright at 375px, signed-in state if possible (or long-name locale): navigate `/en`, screenshot header. Confirm crowding/wrap.

- [ ] **Step 2: Reduce gap + add padding-inline on mobile**

In `.main-header`, add:

```scss
  @include respond-below(sm) {
    gap: 1rem;
  }
```

(The header sits inside `.container` which already gives 1rem side padding at mobile — do not add width/flex layout to any reusable child component; keep layout here in the header block.)

- [ ] **Step 3: Truncate the welcome name**

Read `MainMenu.tsx` to confirm the exact class on the welcome text. In its SCSS (`_main-menu.scss`), add a mobile cap so the name ellipsizes rather than wraps:

```scss
  @include respond-below(sm) {
    max-width: 45vw;
    @include trimEllipses;   // existing mixin: ellipsis + nowrap + overflow hidden
  }
```

Target the welcome link element specifically (not all menu links) — read the markup to pick the right selector.

- [ ] **Step 4: Verify**

Playwright at 375px: logo + menu + language switcher all on one row, name ellipsized, no wrap, scrollWidth → `true`. Test a long name / `/ru`. (User commits.)

---

### Task 8: Legal-page content guards

**Files:**
- Modify: `src/assets/scss/blocks/_legal-page.scss`

**Interfaces:** Consumes `respond-below` (optional). The risk is injected Termly HTML with wide tables/`<pre>` (no width guard today).

- [ ] **Step 1: Migrate the raw breakpoint + add width guards**

Change the existing `@media (max-width: 720px)` (line 5) to `@include respond-below(md)` (768px ≈ 720px; verify the top-padding step still looks right). Inside `&__content`, add:

```scss
  &__content {
    line-height: 1.7;

    :is(table, pre, img) {
      max-width: 100%;
    }
    table {
      display: block;
      overflow-x: auto;   // wide tables scroll inside their box, not the page
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
```

- [ ] **Step 2: Verify**

Playwright at 375px: navigate `/privacy`, `/terms`, `/cookie-policy`, `/refund`, screenshot each, scrollWidth → `true` (page does not scroll horizontally even if a table does inside its own box). (User commits.)

---

### Task 9: Footer overlay collision

**Files:**
- Modify: `src/assets/scss/blocks/_main-footer.scss` (`--overlay` variant, lines 7-13)
- Read: where `.main-footer--overlay` is rendered (grep `main-footer--overlay`)

**Interfaces:** Consumes `respond-below`. The `--overlay` variant is `position: fixed; bottom: 0; pointer-events: none` and can cover bottom CTAs (reader "Summon", tarot post-actions) on 100dvh screens.

- [ ] **Step 1: Confirm which screens use `--overlay` and where it collides**

Grep for `main-footer--overlay` to find the render sites. Playwright at 375×812 and a short height (e.g. 375×640): navigate `/en`, screenshot — check whether the fixed footer legal row overlaps the reader "Summon" button or tarot actions.

- [ ] **Step 2: Prevent the collision**

The footer already has `pointer-events: none` (links re-enable via `pointer-events: auto`), so it does not block clicks — the issue is visual overlap. On mobile, keep the overlay footer out of the CTA zone. Add to `.main-footer--overlay`:

```scss
    @include respond-below(sm) {
      // On short mobile screens the fixed footer must not sit on top of
      // primary CTAs; drop the disclaimer/legal block's visual weight here.
      .main-footer__disclaimer { display: none; }
    }
```

Decide the exact reduction from the screenshot evidence — if only the disclaimer overlaps, hiding it on mobile overlay is enough; if the legal row also overlaps, additionally reduce its `font-size`/`margin` at `respond-below(sm)`. Do not change desktop.

- [ ] **Step 3: Verify**

Playwright at 375×640 and 375×812: reader "Summon" and tarot post-actions are fully visible and not covered by the footer; scrollWidth → `true`. (User commits.)

---

### Task 10: User-profile cosmetics

**Files:**
- Modify: `src/assets/scss/blocks/_user-profile.scss` (`.profile-page` padding `:2`, title `:11`)

**Interfaces:** Consumes `respond-below`. Current: `.profile-page { padding: 160px 0 100px }` and `.profile-page__title { font-size: 2.5rem }` — no mobile reduction.

- [ ] **Step 1: Add mobile padding + title step-down**

```scss
  .profile-page {
    @include respond-below(sm) {
      padding: 100px 0 80px;
    }
  }
  .profile-page__title {
    @include respond-below(sm) {
      font-size: 1.9rem;
    }
  }
```

(Match exact nesting/selector structure of the existing file — read it first to place these inside the right blocks.)

- [ ] **Step 2: Verify**

Playwright at 375px: navigate `/en/profile` (signed-in), screenshot — reduced top gap, title fits one/two lines, credits/deck/reader rows readable, scrollWidth → `true`. (User commits.)

---

### Task 11: QA sweep of the already-correct pages

**Files:** none expected — verification only. If a real break is found, fix at that file's existing breakpoint using `respond-below` and note it.

**Interfaces:** none.

- [ ] **Step 1: Screenshot sweep at 375px**

Playwright resize 375×812, navigate and screenshot each, scrollWidth → `true` on all:
- `/en/subscription` — 4-col → single column
- `/en/decks` — 3-col → single column
- `/en/contact` — form full-width, submit fits
- base modal — open login modal, full-screen mobile
- `/payment/result` — centered, fits
- `/en` tarot 3-card grid — 3×100px cards fit (open the reading flow)

- [ ] **Step 2: 320px edge check**

Repeat the sweep at 320×568 for the two tightest (tarot 3-card grid, subscription). scrollWidth → `true`.

- [ ] **Step 3: Final build**

Run: `npm run build`
Expected: succeeds (Sass compiles, no type errors). (User commits the whole branch when satisfied.)

---

## Self-Review

**Spec coverage:** Breakpoint mixin → Task 1. `.mystic-btn` → Task 2. Overflow-x net → Task 4. Tarot post-actions → Task 3. Reader modal → Task 5. Offer-block title → Task 6. Header → Task 7. Legal tables → Task 8. Footer overlay → Task 9. Profile cosmetics → Task 10. QA the correct 6 → Task 11. All spec fixes mapped.

**Ordering note:** Task 4 (overflow net) runs after Tasks 2–3 per the spec (net, not primary fix). Task 3 depends on Task 2's narrower button. All other tasks are independent and could run in any order after Task 1.

**Placeholder scan:** No TBD/TODO; every code step shows concrete code; verification steps give exact viewport + assertion.

**Type/name consistency:** `respond-below`/`respond-above` and `$breakpoints` tokens `sm`/`md`/`lg` used consistently across all tasks. `trimEllipses` and `link-style` are existing mixins in `_mixins.scss`.

**Known judgement points (intentional, evidence-driven, not placeholders):** Task 3 row-vs-column and Task 9 disclaimer-vs-legal-row are decided from screenshot evidence during execution, with the default spelled out.
