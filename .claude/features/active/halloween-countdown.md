<!-- CLAUDE: First read .claude/features/README.md for how to work with this file -->

# Halloween countdown banner

## Status

Started 2026-10-17 by Kenneth. Built on branch `halloween-countdown`. After a first look in the browser Kenneth moved it to the very top of every page, above the header. Goes to Lena as a pull request.

## Goal

A Halloween banner at the top of every page with a live countdown that draws visitors into the games. It must look like it belongs to The Veil (its colors, shapes and spacing) and must not push the reader block onto the title on a phone.

## Files

- `src/lib/halloween.ts` — when it shows (October only), the countdown maths, the boot script; tests in `halloween.test.ts`
- `src/components/HalloweenBanner.tsx` — the strip
- `src/assets/scss/blocks/_halloween-banner.scss` — its look (slim row on phones, digit boxes from md)
- `src/components/SiteChrome.tsx` — mounts it once above the header, on every page that has the header
- `src/assets/scss/blocks/_main-header.scss`, `_header-greeting.scss`, `global/_scafolding.scss` — header, phone greeting and page shell start under the strip (`--banner-h`)
- `src/app/[locale]/layout.tsx` — runs the boot script before the first paint
- `messages/*/game.json` — `banner*` texts in all five languages
- Mockup: design canvas "Halloween Countdown Banner" (phone and computer)

## To Do

- [ ] Check in the browser at 375px and 1440px (signed out and signed in)
- [ ] Pull request; Lena reviews

## In Progress


## Done

- [x] Mockup of option B (phone and computer)
- [x] Date logic and tests
- [x] Banner component and styles, phone first
- [x] Placed at the top of every page above the header (first try was under the header on the main page only); shows from the first frame, drops in with the header during the intro
- [x] Texts in en, no, ru, uk, tr

## Notes

- Choices made for Lena's review on GitHub (Kenneth, 2026-10-17): counts down to midnight at the start of 31 October by the visitor's clock; on 31 October it says "Halloween is here"; hidden from 1 November; the pumpkin pill stays as it is. The strip's button reuses the pill's texts ("Witchy games", "Enter if you dare").
- Option A (countdown inside the pumpkin pill, no new height) was offered; Kenneth chose B for more attention.
- Shows only under `<html data-halloween>`, set by a boot script before the first paint (the intro's pattern), so the page never jumps and server and client HTML match.
- Lena's earlier decision (`docs/games.md`): the way into the games stays in the page flow, never floating. The strip is in normal flow.
- The strip is in normal flow, so pages move down by themselves; only things positioned against the page top read `--banner-h`. The computer strip is 104px (the mockup's 132px was too much on every page).
- Known: the castle game's phone room is sized `100dvh - 7rem`, so in October it is the strip's height taller than the screen.
- Colours: the potion game's own plum and ember, the app's gold variables; no new colours.
