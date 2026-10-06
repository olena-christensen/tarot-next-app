# Crooked Cauldron — project brief

Crooked Cauldron is the name for a family of witchy browser games: potions, Halloween, blood, curses, rituals. The first game is **Brew the Potion**, a hidden-object game: find the recipe's ingredients hidden in a witch's room and drop them into the cauldron.

For now the games live **inside The Veil** (https://theveil.app), Lena's tarot app. They share its code, accounts, languages and its in-app currency, moonstones. This project is where the games are planned and built. The tarot app itself is discussed in the "tarot" project.

Why the games stay inside The Veil (decided 2026-10-06): the games are the "something to do" content The Veil needs. People came from Facebook, played, sent potions and signed in. Keeping them together means one account, moonstones and potion gifts all keep working. If Crooked Cauldron grows big later (more games, a shop), it can move to its own address then.

Name check (2026-10-06): no game or big brand called Crooked Cauldron was found. Two small unrelated uses exist: an Instagram apothecary shop and a blog post. crookedcauldron.com, .games, .app and .net showed no website (not proof they are unregistered). Check: https://www.namecheap.com/domains/registration/results/?domain=crookedcauldron

---

## How Lena works — read this first

- **Never change design or any visible text before Lena approves it.** First show exactly how it will look (a mockup picture), then wait for an explicit yes. No exceptions.
- **No jargon, no abbreviations.** Explain plainly, step by step. Lena is an experienced frontend developer but does not want insider talk.
- **Check before claiming.** Look at the real code, files or service before saying something is true. Never state a guess as a fact. Never make up what Lena did ("you posted 24 pins" when she said 15).
- **Exact clickable links**, never menu paths.
- **Every new text goes into all 5 languages:** English (en), Norwegian (no), Ukrainian (uk), Russian (ru), Turkish (tr).
- **Git is Lena's.** She commits and deploys herself in WebStorm. Do not mention git unless she asks. After every change, give her a ready commit message.
- When there are new files, remind her to press **Cmd+Option+Y** in WebStorm ("Reload All from Disk") so WebStorm sees them.
- Database changes: Claude writes the change file; **Lena runs it herself** (see "Database" below). She does not want Claude connected to the database.
- Simple account actions (creating accounts, downloads) Lena does herself.
- Working docs she copies from: one stacked block per item, each field on its own line. No wide tables.
- Do the work thoroughly. No shortcuts, no "probably" items in to-do lists.

---

## Where everything is

Code: `/Users/morthalion/Projects/tarot-next-app` (Next.js 14, next-intl for languages, NextAuth for sign-in, Prisma with a Neon Postgres database, hosted on Vercel).

The repository's `CLAUDE.md` has a long "Brew the Potion" section with every technical detail. Read it before changing the game.

Game files:

- Page: `src/app/[locale]/game/page.tsx`
- The game itself: `src/components/BrewPotionGame.tsx`
- Rules (recipes, hiding spots, gift links): `src/lib/potionGame/index.ts` (+ test `potionGame.test.ts`)
- Moonstones and gifts on the server: `src/lib/potionGame/reward.ts` (+ test `reward.test.ts`)
- Who is playing (account or visitor cookie): `src/lib/potionGame/owner.ts`
- Keeping the end screen across Google sign-in: `src/lib/potionGame/claim.ts`
- Animated picture for computers: `src/lib/potionGame/potionGif.ts`
- Progress row (3 bottles → moonstone): `src/components/PotionMoonRow.tsx`
- Friend's "Take the potion" block: `src/components/PotionGiftTake.tsx`
- Friend's potion page: `src/app/[locale]/potion/[code]/page.tsx`
- Way in from the main page: `src/components/GameEntrance.tsx`
- Styles: `src/assets/scss/blocks/_potion-game.scss`
- Texts: `messages/{en,no,uk,ru,tr}/game.json` (namespace `game`)
- Server addresses (API routes): `src/app/api/game/round` (start), `round/finish`, `round/decide` (keep or send), `progress`, `gift/take`

Art:

- Full-size source pictures (not published): `game-art-source/`
- Build script: `scripts/build-potion-art.py` → writes `public/game-art/potion/` and `src/lib/potionGame/spots.generated.json`
- Sounds: `public/sounds/magic-found.mp3` (tap), `public/sounds/cauldron-bubble.mp3` (landing)

Pinterest pin pictures: `tarot-next-app/Claude outputs/pinterest-pins/` (pins 28–30 are the game pins).

---

## How Brew the Potion works today

**A round.** The recipe has 3 ingredients with counts 1, 2 and 3 (6 items to find). 7 ingredients exist: bat eye, frog tongue, dragon tear (in a vial), raven feather, spider, toadstool, newt tail. They are hidden in 16 hiding spots (39 ingredient-in-spot combinations), never two things in one spot. The potion is named after the ×3 ingredient (for example "Elixir of Night Sight").

**The art is pre-built.** The room is one picture. Each ingredient in each spot is a ready-made transparent patch with lighting, shadow and "hidden behind things" already baked in. To add or move a spot or ingredient: edit the script, run `python3 scripts/build-potion-art.py`, check `game-art-source/_contact.png`.

**Playing.** Tap an item: ring, glow, it spins in an arc into the cauldron, green flash, steam, bubbles, twinkle sound, bubbling sound. Wrong taps shake the picture; 3 wrong taps in 2 seconds blur it for 5 seconds. One hint per round. Timer.

**Phones.** The game takes the whole screen (no page scrolling, no sideways sliding). Swiping back is caught while playing; only the ✕ leaves. Pinch to zoom, drag to look around; the room opens centred on the cauldron.

**End screen** (approved 2026-10-07): bottle, "You brewed", potion name, time. A skull in the top right corner goes to the main page (same skull the site's pop-ups use to close). Progress row: 3 bottles → moonstone, no border. Then:

- "Keep it" or "Send it to a friend" — nothing counts until the player chooses. Leaving or brewing again counts as Keep.
- After Keep: progress line ("2 of 3 potions today — one more for a moonstone", or "+1 moonstone! Come back tomorrow for another") and "Brew again".
- After Send: "Sent! It's theirs once they open the link" and "Brew again".
- If today's moonstone is already earned: no "Keep it" — "Today's moonstone is yours — this one is free to give away".
- Visitors who are not signed in see the same progress. At 3 potions only a "Claim your moonstone" **link** (not a button — Lena). At 1–2 potions a "Sign in to keep your progress" link. Their potions are kept and counted after sign-in; Google sign-in returns to the game with the end screen restored.

**Moonstones.** 3 kept potions in one day = 1 moonstone, once per account per day. The day resets at midnight Kyiv time. The server times every round; a round under 10 seconds does not count. The moonstone goes into the same balance The Veil uses (shown in the header).

**Sending a potion is a real gift** (approved 2026-10-07). The link is `https://theveil.app/potion/{code}` with **no language in it**, so each friend gets their own language. The friend's page says "Lena sent you a potion", shows the bottle, and a "Take the potion" link. A signed-in friend gets it straight away; others sign in first. The potion counts toward the friend's 3 for that day, once, within 7 days. You cannot take your own potion. Used, expired or old links show "This potion has already been taken".

**Sharing.** Phones open the phone's own share menu with the link only, so messengers show a tappable card (the card picture is just the glowing bottle). Computers get a share dialog: Facebook, X, Telegram, WhatsApp, Slack (copies the link), copy link, and a download of an animated picture.

**Way in from the main page:** a glowing pill under "Change your reader": "A Halloween treat" in October, "A little game" otherwise.

---

## Connection to The Veil (shared, do not break)

- **Accounts:** the same sign-in (Google or email). The login window is opened from the game through The Veil's `LoginContext`.
- **Moonstones:** stored in `Subscription.readingCredits` in the database. After a reward the game calls `notifyMoonstonesChanged()` so the header balance updates.
- **Page frame:** the game page uses The Veil's `PageShell` (header, footer, login window).
- **Languages:** 5 languages, The Veil's language rules. Links for sharing or pins must never contain `/en/` — `/en/` forces English for everyone.
- **Analytics:** Vercel events `potion_started`, `potion_finished`, `potion_shared`, `potion_gift_taken`.

---

## Database

Two tables belong to the game:

- `PotionRound` — one row per round: who played (account or visitor cookie), start and finish time, day (Kyiv), outcome (kept or sent), and who took it if it was a gift.
- `PotionReward` — one row per account per day; makes a second moonstone the same day impossible.

How changes reach the database: Claude writes a migration file in `src/generated/prisma/migrations/`. Lena then runs, in the WebStorm terminal:

```
npx prisma migrate deploy
npx prisma generate
```

and only then deploys. Ignore Prisma's "Update available 6 → 8" box — upgrading would break things.

Safety note (checked 2026-10-06): on Neon's free plan, changes can only be undone for the last 6 hours (https://neon.com/docs/postgres/backup-restore/history-window).

---

## Status (2026-10-06)

Done and committed:

- The game, phone layout, sharing, main-page way in
- Moonstone reward (3 potions = 1 moonstone a day) — migration `20261007120000_add_potion_rounds` was run on the database
- Potion gifts (keep or send) — committed as "Brew the Potion: sending a potion is a real gift"

To check:

- Whether migration `20261008120000_add_potion_gifts` was run with `npx prisma migrate deploy` before deploying, and whether that deploy is live
- On a real phone after deploy: send a potion to someone else; they sign in and should see "1 of 3 potions today"; the sender's count must not go up
- Messenger link card, the main page on Lena's mother's phone, a full round on a phone

What the numbers said (Vercel, 5 October): about 44 visitors in one day, 30 of them from Facebook after Lena posted potions. The potion pages got 12, 11 and 7 visits. The game page: 6 visits in English and 3 in Ukrainian. Pinterest: 1 visitor so far (normal — Pinterest takes weeks).

Pinterest: game pins 28–30 are posted on the board "Witch's Workshop: Potions & Games". Pin log is in the tarot project: `docs/pinterest-pin-log.md`.

---

## Ideas (not decided yet)

- **Next evening:** a second Brew the Potion scene, a Halloween room (pumpkins, candles, a black cat). Reuses everything already built, can be finished in one evening, right on time for October.
- **Decorate a Halloween room:** a bigger, different game. Better after Halloween.
- **The coven:** a Facebook group for The Veil (Lena's visitors are on Facebook). Later: a small "Join the coven" link on the game's end screen and the potion page (mockup first).
- **Shop:** The Veil's long-term plan includes a shop of witchy goods. The hidden objects can later become shop items, and Crooked Cauldron can grow into that corner.
- Pinterest pins for each new scene.

---

## Decisions log

- 2026-10-05 — Name of the first game: Brew the Potion. Cartoon style, green glow room. Tear goes in a vial.
- 2026-10-05 — Sounds: "B twinkle" for a found item, "B thick" bubbling for landing.
- 2026-10-06 — Phones get a full-screen game. Share link has no language. Card picture is the bottle only.
- 2026-10-06 — Umbrella name: Crooked Cauldron. Games stay inside The Veil for now.
- 2026-10-07 — 1 moonstone a day for 3 potions; visitors see progress and claim by signing in. End screen: no "Draw your cards", skull to main page, "Claim your moonstone" is a link, no "waiting" text, no border.
- 2026-10-07 — Keep or send before counting; sent potions are real gifts for 7 days; old links show "already taken".
