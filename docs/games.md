# Games

The code is the only source of truth for the games. This file holds only what the code cannot say. When a line here disagrees with the code, the code is right: tell Lena in one line the moment you notice, and fix the line in the same change.

## How the games connect to The Veil

1. Accounts: the same sign-in and the same login window (`LoginContext`).
2. Moonstones: one balance, `Subscription.readingCredits`. A game never adds a second currency, daily limit or balance.
3. Page frame: every game page sits inside `PageShell`.
4. Languages: the app's five languages and its routing; shared links carry no language.

Moving a game to another platform means replacing these four, nothing else.

## Brew the Potion: decisions

- No foam in the boil-over: a flat outlined foam and then a painted slime were rejected.
- Recipe icon plates stay two tones lighter than the bar; a lighter purple plate was rejected.
- "Claim your moonstone" is a link, not a button.
- No "Draw your cards" button on the end screen.
- Phones share the link only, with no title or text.
- The share picture is the bottle alone; who brewed what goes in the title.
- The way in from the main page stays inside the reader block; a floating version covered the buttons.

## They Arrive at Midnight: decisions

- Half-realistic painting, never cartoonish; the first drawn guests were rejected.
- No home-made decor such as candles in bottles or on plates: it is a castle.
- No candles on the dining table; candelabras stand on the mantel and the shelf.
- Candelabras face on in the Emporium and on the phone's mantel.
- In the hall the gramophone shows only its horn, on the wall in the right corner; no table or shelf for it.
- Three chairs and three place settings per side; other table items sit centred between a pair of plates.
- Russian and Ukrainian address the player with "вы" / "ви".
- Ideas, not built: the Count, and bribing the butler to bring him.
