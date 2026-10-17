<!-- CLAUDE: First read .claude/features/README.md for how to work with this file -->

# Games cleanup

## Status

Found on 2026-10-17 while checking the docs against the code. Nothing started. Every item needs Lena's yes before code changes.

## Goal

Make the code comments match the code, and fix the small problems found in the two games.

## Files


## To Do

- [ ] Out-of-date comment: the database schema says `CastleSpin` holds only "free" and "paid" spins; party bats are stored there too, under day `party`.
- [ ] Out-of-date comment: the database schema says `PotionRound` rows only matter on their day and only today's visitor rounds move to the account; `reward.ts` keeps rounds 8 days and moves all of them.
- [ ] Out-of-date comment: `encodeGift` in `src/lib/potionGame/index.ts` says the link needs no database row; it now carries a round id checked in the database.
- [ ] Out-of-date comment: `CastleGame.tsx` header gives the phone room as 776×1680 with only the three back-wall frames; `scripts/build-castle-art.py` has the same frames note. Remove the size and fix the frames wording.
- [ ] Out-of-date comment: `autoPlace` in `src/lib/castleGame/catalog.ts` is described as "firewood lights the fire"; no item uses it any more.
- [ ] Vault card says "In your items" (`castle.inStorage`) for unplaced things: the name from before the Vault rename. Text change: mockup first.
- [ ] Eight strings in `castle.json` are used by no component: `partySoon`, `spinTomorrow`, `notEnough`, `getMoonstones`, `owned`, `ownedPlaced`, `roomOnly`, `showButtons`. Remove from all five languages.
- [ ] `/castle/survived` gives its link preview an address with a language (`/{locale}/castle/survived`); the shared link has none. Make the preview address match the shared link.
- [ ] A received castle gift keeps its item row id; if the friend sends it on, the first sender's old link works again.
- [ ] Lit firewood has no "Take down" in the hall or the Vault. Ask Lena whether it should.
- [ ] No tests for `src/lib/castleGame/`.

## In Progress


## Done


## Notes

- Outside the games, reported to Lena for the tarot project: `docs/STATUS.md` still lists the potion moonstone reward as "Do next" (built 2026-10-07) and describes the potion game at `/game` with 7 ingredients; `CLAUDE.md` points to `.claude/skills/task-doc/SKILL.md`, which does not exist, and says `Loader.tsx` is unused while the game loading pages use it.
