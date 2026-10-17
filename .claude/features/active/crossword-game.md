<!-- CLAUDE: First read .claude/features/README.md for how to work with this file -->

# Crossword game (Hexword)

## Status

Started 2026-10-17. Design stage: mockup on the canvas "Halloween Crossword" (phone, desktop, friend's page, shared result picture); no code until Lena approves it. Halloween contest runs 27–31 October.

## Goal

A third Crooked Cauldron game inside The Veil: a Halloween crossword. Witchy, wicked words and clues; the screen dressed in the games' black and gold. English first, other languages after.

## Files


## To Do

- [ ] Check no other word game uses the name Hexword
- [ ] Lena decides: can a missed contest day be caught up, or does it break the run
- [ ] Contest rules text on the page (who can enter, end date, how the yearly winner is drawn)
- [ ] Write 5 contest puzzles in each of the 5 languages (25 grids; each language its own grid, not a translation)
- [ ] Shared result picture: solved grid as gold squares, no letters, with the time
- [ ] Ask a friend: link to the asker's grid on one clue; friend signs in to answer; the word lands in the asker's grid; helper earns 1 moonstone once a day
- [ ] Build the game page and its route; time each puzzle on the server
- [ ] Grant the rewards: Initiate month to every finisher, yearly draw, 50 moonstones for the fastest total
- [ ] Add it to the games page (`GameChoice`)

## In Progress

- [ ] Mockup — waiting for Lena's yes
- [ ] First English puzzle: grid and clues — waiting for Lena's yes

## Done


## Notes

- Draft puzzle (2026-10-17), 13 by 13, 12 words: COBWEB, PUMPKIN, COVEN, RAVEN, GRIMOIRE, MIDNIGHT across; CAULDRON, BANSHEE, MOONSTONE, POTION, CRYPT, HEX down.
- Decisions (Lena, 2026-10-17): name Hexword. Halloween contest, one new puzzle a day for the 5 days before Halloween (27–31 October). Everyone who finishes all five gets a month of Initiate; one yearly plan is drawn among them. Fastest total time over the five gets 50 moonstones. Solving earns moonstones. No paid "Reveal a letter". Sharing the result and "Ask a friend" both wanted.
- Pumpkins (Lena, 2026-10-17): three different painted jack-o'-lanterns in the style of the main page's witch-hat pumpkin (witch hat, small one with a candle, old cracked one), each with a calm, delighted and furious face. A correctly finished word makes one of them grin and blaze; a wrong one makes it scowl and dim. Flat drawn pumpkins and two identical mirrored ones were rejected.
- The screen is painted: the grid lies on an open grimoire on a witch's desk (phone and computer backdrops). Art made in Canva; full-size files are in ~/Pictures/hexword-art.
- The games connect to The Veil the same four ways as the others (`docs/games.md`): accounts, moonstones, `PageShell`, the five languages.
