# TODO — UI fixes (mobile & general)

## Open
- [ ] **Decide on the remaining `respond-below(sm)` overrides.** The three desktop-first *files* are converted (below). What's left are small `respond-below(sm)` tweaks inside otherwise mobile-first files (`_tarot`, `_main-header`, `_mystic-btn`, `_user-profile`, `_main-footer`, `_main-menu`, `_title`, `_reader-selection`) — these have a mobile base and shrink for tiny screens (some documented as intentional in CLAUDE.md, e.g. `.mystic-btn`). Not desktop-first; left alone. Flip to `respond-above` only if we want strict single-direction consistency.

## Done (2026-07-13)
- [x] **Reader screen mobile bottom sheet** — below `md` the summon pane (bio + Summon) is a fixed bottom sheet portaled to `<body>` (nailed to the device bottom; escapes `.modal__content`'s `backdrop-filter` containing-block trap). Dismisses on scroll, re-shows on tapping a reader. Cards now stack single-column below `md` (was `lg`), inline row from `md+`. Verified live at 360px + 1962px.
- [x] **Reader screen no longer jumps when switching readers** — bios overlap in one grid cell (pane height = tallest bio) and summon labels overlap in another (button width = widest label); only the active one shows. Kills both the vertical modal reflow and the horizontal button jump. Locale-proof.
- [x] **Modal title padding-right on mobile** — `.modal__title` clears the top-right close button (36px + 16px) so a long left-aligned title doesn't run under it; reset at `md+` where the title is centered.

## Done (2026-07-06)
- [x] **Desktop-first files converted to mobile-first** — `_subscription`, `_decks`, `_legal-page`. Base is now the mobile layout; larger screens scale up via `respond-above`. Raw `max-width: 720px/960px` queries tokenized to the shared map (`720→md`, `960→lg`). Compiles clean.

## Done (2026-07-05)
- [x] **Cookie banner no longer pops over the intro** — waits for the intro, appears when the deck/Summon CTAs animate in.
- [x] **Footer removed from the cards/reading screen** (it's a screen, not a page).
- [x] **Cards screen mobile spacing** — 8px padding, 6px card gap, cards grow to fill the reclaimed width (≤sm).
- [x] **Ukrainian title no longer overlaps the reader portrait** — smaller mobile title (font + line spacing), title sits higher, smaller mobile header padding.
- [x] **Language options Save button** uses the standard `--border-radius` (was a full pill).
- [x] **Cookie consent redone as a small centered card** — starts at mid-screen, auto height downward.
