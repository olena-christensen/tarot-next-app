# Feature files: instructions for Claude

## Where files live

```
.claude/features/
├── README.md, TEMPLATE.md   ← only these two at the root
├── active/                  ← work in progress; new files start here
└── completed/               ← finished, cancelled or dropped
```

Name a file `<short-name>.md` (for example `third-game.md`). A feature with several files gets its own folder inside `active/`.

A file for work that was dropped or cancelled still moves to `completed/`: the decision is the record. Say so in its Status.

## Starting a session

1. Read every file in `active/`. These are the plans in flight: what is done, what is left.
2. If an item under "To Do" is already done in the code, say so in your first reply and move it to "Done".
3. Read the repository's `CLAUDE.md` and, for games, `docs/games.md`.

## When you receive a feature file

1. Read the Goal.
2. Read "To Do" (Lena may have added tasks) and add more as needed.
3. Explore the code as needed.
4. Start working and track progress in the file.

## Updating the feature file

Update **continuously** as you work, not at the end:

- Move tasks: To Do → In Progress → Done, the moment each one changes.
- Add key files to "Files".
- Add decisions, blockers and discoveries to "Notes".

The file describes the plan and its progress only. What the code already says (prices, sizes, counts) is not copied here; read the code.

## Updating the lasting docs

**When:** only after the feature is complete.

**What:** only things that meet all of these:

- They apply to any future work in that area, not just this feature.
- They are not obvious from reading the code.
- They are a decision or a business rule, not an implementation detail.

Where they go: game decisions and how the games connect to The Veil go in `docs/games.md`; rules for the whole app go in `CLAUDE.md`. Most discoveries stay in Notes.

## Before marking complete

1. All tasks are in "Done", or moved to a new feature file with a note saying so.
2. Key files are listed in "Files".
3. Important decisions are in "Notes".
4. Any lasting rule is added to `docs/games.md` or `CLAUDE.md` (see above).
5. Lena has said the feature is finished. Then move the file from `active/` to `completed/`.
