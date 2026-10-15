# Dream meanings

**Status (2026-10-15):** prototype built on branch `dream-interpritor`: 40 symbols (batches 1 and 2) in all 5 languages, the "Tell me your dream" tool, result page, share picture, menu entry, second home-page pill, footer link, combined search. Not yet type-checked, tested or looked at in a browser (no shell was available when it was written).

Goal: more visitors from Google and from sharing, led into a free card reading.

## Hard rule

No Russian services, and no tool that needs signing up, for numbers or anything else. Never suggest them. Real search numbers come from Search Console (already set up) once the pages are live.

## Decisions

- Meanings are written, not made by artificial intelligence. Source: Gustavus Hindman Miller, "10,000 Dreams Interpreted" (1901), free to use. The words are retold fresh, not copied.
- English slugs in every language, like `/cards/the-moon`. Never `/en/` in links.
- Free, not counted against the daily reading limit.
- Dream pages are plain: the meaning and a button to draw the free cards. They do not match a tarot card to a dream.
- "Tell me your dream": the visitor picks or types up to 3 things they saw, gets a short meaning per thing and one randomly drawn card, and can share it as a picture.
- Sharing travels inside the link, no database: `/dreams/result/{symbols}/{card-slug}`, symbols joined by `_` (for example `water_falling`). Result pages are noindex. Each link gets its own share picture (`opengraph-image.tsx` in that folder).
- Ways in: header menu item "Tell me your dream" with a "New" tag, a second glowing pill under the games pill on the main page, a footer link. The header magnifier opens `/cards`, whose one search box finds cards and dreams together.
- Release symbols in batches of 20.
- Card pages do not link to dreams and dream pages do not link to cards (default, not asked for).

## Where things live

- Symbols and English text: `src/lib/dreamMeanings.ts`. Other languages: `src/lib/dreamTexts/{uk,ru,tr,no}.ts`, keyed by the English slug, joined by `src/lib/dreamTranslations.ts`. A language without a table falls back to English and must not be in `DREAM_CONTENT_LOCALES` (`src/lib/seo.ts`).
- Pages: `src/app/[locale]/dreams/` (`page.tsx` list, `[slug]`, `tell`, `result/[symbols]/[card]` with its share picture).
- Components: `DreamTeller`, `DreamIndexSearch`, `DreamShareButton`, `DreamEntrance`; `CardSearch` also takes the dream list.
- Words for buttons and labels: `messages/{locale}/dreams.json`, merged in `src/i18n/request.ts`.
- Styles: `src/assets/scss/blocks/_dreams.scss`. The second pill reuses `.game-entrance` with `--dream`.
- Sitemap: `src/app/sitemap.ts` lists the dream pages for every locale in `DREAM_CONTENT_LOCALES`.
- Tests: `src/lib/dreamMeanings.test.ts`.

## Found in the code

- Readings are assembled from written text (`src/lib/generateReading.ts`); no artificial intelligence service in the project.
- Limits: visitors not signed in get 1 reading a day (`src/lib/anonReadingLimit.ts`), signed-in Seekers 3 (`src/lib/readingAccess.ts`).

## Not done yet

- The uk, ru, tr and no words (button labels and the 40 dream texts) were written by Claude, not by a native reader. Lena chose not to review them.
- Remaining batches. Batch 1: water, falling, snake, teeth, flying, being chased, house, fire, death, baby, dog, cat, ocean, money, wedding, exam, car, mirror, bridge, forest. Batch 2: pregnancy, the dead, child, fish, sea, ex-partner, cheating partner, rats, gold, blood, being naked, being late, being lost, funeral, rain, snow, mother, father, spider, bird. Candidates for later batches: graveyard, hair, bear, horse, mouse, crocodile, lion, flood, storm, door, stairs, knife, hands, adjusted by what Search Console shows.
- Letter headings on `/dreams` once there are around 60 dreams.
- Artificial intelligence for signed-in Seekers as a moonstone item, only if people use the tool.
