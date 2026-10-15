# Dream meanings — plan

**Status:** idea and first decisions agreed 2026-10-15. Not planned yet: how it connects to the existing site and how it looks. No code, no mockups yet.

Goal: more visitors from Google and from sharing, led into a free card reading.

## Hard rule

No Russian services, and no tool that needs signing up, for numbers or anything else. Never suggest them. Real search numbers come from Search Console (already set up) once the first pages are live.

## Agreed

- Meanings are written, not made by artificial intelligence. Artificial intelligence may come later for signed-in Seekers as a moonstone item, only if people use the tool.
- Source for the meanings: Gustavus Hindman Miller, "10,000 Dreams Interpreted" (1901), free to use everywhere.
- Address: `theveil.app/dreams/{symbol}`, English slugs in every language (like `/cards/the-moon`). `/dreams` itself is "Tell me your dream". Never `/en/` in links.
- Free and not counted against the daily reading limit.
- Dream pages are plain: the meaning of that dream and a button to draw the free cards. They do NOT show or match a tarot card (an earlier idea of matching a card to each dream was dropped 2026-10-15; it was never asked for).
- "Tell me your dream": visitor picks or types what they saw, gets a short meaning and one randomly drawn card, can send it to a friend as a picture card (like the potion cards).
- Release symbol pages in batches of 20, not all at once.
- Way in from the main page: a second glowing pill, next to the games pill (decided by Lena 2026-10-15). Today the main page has one pill (`GameEntrance`, in `OfferBlock.tsx` under "Change your reader") and the quiet "What lies beyond the Veil?" line. The top menu (`MainMenu.tsx`) has only a magnifier icon to the card meanings plus sign-in; the footer has the same card meanings link.
- Next topic after that: a real menu where all the site's features live, because more pills will not scale. For everyone, not only signed-in people (Lena, 2026-10-15). The search (magnifier) STAYS in the header, reachable at once; the menu button goes next to it and does not replace it. Proposed list, order: Read your cards (main page), Tell me your dream, Card meanings, Witchy games, Decks, Subscription; signed-in only: My readings, My profile; contact and legal stay in the footer; moonstones get a place once they exist.
- Search today: the magnifier only links to /cards, where `CardSearch` searches card meanings only. Decided (Lena, 2026-10-15): the header search finds cards and dreams together.
- Header (decided Lena 2026-10-15): the language switcher stays in the header exactly as today, on phones too (not moved into the menu). The text "Reveal yourself" becomes a log-in icon with a hover tooltip "Reveal yourself". Signed-in people get a log-out icon next to the avatar with the hover tooltip "Sleep into shadows". Phones have no hover, so the icons need accessible labels (drawn in the mockup). Mockup (private): https://claude.ai/artifact/9MrhB3Y5dBnbjbY8KrR675

## Two parts

1. Dream pages: copy of the card pages. `src/app/[locale]/dreams/[slug]`, `src/lib/dreamMeanings.ts`, its own indexed-languages list next to `CARD_CONTENT_LOCALES` in `src/lib/seo.ts`, its own block in `src/app/sitemap.ts`. All 5 languages (en, uk, ru, tr, no).
2. "Tell me your dream": sharing travels inside the link (like the potion link, no database), and a share picture is drawn for each link (like `/r/[shareId]/opengraph-image.tsx`), so every Facebook preview shows the visitor's own result.

## Found in the code

- Card pages (`src/app/[locale]/cards/[slug]/page.tsx`) have no link to a free reading, only share and previous/next.
- Readings are assembled from written text (`src/lib/generateReading.ts`); no artificial intelligence service in the project.
- Limits: visitors not signed in get 1 reading a day (`src/lib/anonReadingLimit.ts`), signed-in Seekers 3 (`src/lib/readingAccess.ts`).

## Open questions (to decide with Lena, one at a time)

- The menu for all features (see Agreed): what goes in it, where it sits, how it relates to the pills.
- Whether the card pages should link to dreams, or the dream pages to cards. Not decided; default is no.
- What the dream page and "Tell me your dream" look like (mockups first).
- Which dreams get a page (a proposed list exists below, not approved and not important yet).

## Proposed dreams, not approved

Batch 1 (20): teeth falling out, snakes, pregnancy, the dead, dying, baby, child, fish, water, sea, house, wedding, ex-partner, cheating partner, being chased, falling, dog, cat, rats, gold.

Later batches: flying, exam, being naked in public, fire, blood, rain, snow, funeral, graveyard, mother, father, mirror, money, hair, being lost, being late, bear, horse, spider, bird, mouse, crocodile, lion, flood, storm, door, stairs, bridge, knife, hands, and about 50 more, adjusted by what Search Console shows.

## Order of work, each step approved before the next

1. Agree how it connects to the existing site.
2. Mockups: dream page, "Tell me your dream" page, result, share picture.
3. First 20 dreams in English, checked, then translated into all 5 languages.
4. Build pages, then the tool, then the share picture.
5. Remaining batches.
