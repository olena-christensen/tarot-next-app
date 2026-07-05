# TODO — UI fixes (mobile & general)

- [ ] **Cookie banner appears before the smoke animation starts** and uglifies the whole intro. Fix ordering: play the intro/smoke animation first, then show the cookie banner.
- [ ] **Remove the footer from the cards screen.** It's a screen, not a separate page — no footer belongs there.
- [ ] **Cards screen on mobile (up to `sm` breakpoint):** reduce padding to `8px`, halve the gap between cards, and increase card size to fill the reclaimed space.
- [ ] **Ukrainian "Discover Your Fate" title overlaps the reader portrait** on mobile. For mobile: reduce header vertical padding, reduce the space between the header and this title, reduce the title font size and line-height.
- [ ] **Language options submit button has rounded corners** — off-spec. Make it follow the general button design (no rounded corners).
- [ ] **Redo the cookie consent as a normal small modal** — shows in the bottom part of the screen with breathing room below it: ~30px from the bottom on mobile, ~100px from `md` up.
- [ ] **Rewrite all desktop-first styles to mobile-first.** Convert every `respond-below`/`max-width`-default block to mobile-first (base = mobile, scale up with `respond-above`). The whole app should be mobile-first — no desktop-first left anywhere.
