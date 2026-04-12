# Deck Selection Feature — Design Spec

**Date:** 2026-04-12
**Branch:** decks-options

## Overview

Add the ability for logged-in users to choose which tarot card deck is used for their readings. Three decks are available: Rider-Waite (default), Klimt, and Gothic-Vintage. The preference is stored in the database and reflected across sessions/devices.

## Decks

| ID              | Folder               | Status  |
|-----------------|-----------------------|---------|
| Rider-Waite     | `public/Cards/Rider-Waite/`     | Default |
| Klimt           | `public/Cards/Klimt/`           | Option  |
| Gothic-Vintage  | `public/Cards/Gothic-Vintage/`  | Option  |

Mystical-SVG is excluded from this feature.

All three decks share identical folder structures (`MajorArcana/`, `Cups/`, `Swords/`, `Pentacles/`, `Wands/`) and identical filenames within each folder.

## Data Model

Add a `preferredDeck` field to the `User` model in `src/generated/prisma/schema.prisma`:

```prisma
preferredDeck String @default("Rider-Waite")
```

Plain string (not an enum) — adding new decks requires no migration. Default ensures existing users get the current behavior.

### Static Deck Catalog

New file `src/lib/decks.ts` (similar to `plans.ts`):

```ts
export const DECKS = {
  "Rider-Waite": { id: "Rider-Waite", preview: "/Cards/Rider-Waite/MajorArcana/fool.webp" },
  "Klimt": { id: "Klimt", preview: "/Cards/Klimt/MajorArcana/fool.webp" },
  "Gothic-Vintage": { id: "Gothic-Vintage", preview: "/Cards/Gothic-Vintage/MajorArcana/fool.webp" },
} as const;

export type DeckId = keyof typeof DECKS;
export const DECK_IDS = Object.keys(DECKS) as DeckId[];
export const DEFAULT_DECK: DeckId = "Rider-Waite";
```

Deck display names live in translation files (`ui.json`), not here.

## Card Image Path Resolution

### Current state

`src/data.ts` stores paths like `/Cards/MajorArcana/fool.webp`. Actual files live at `/Cards/Rider-Waite/MajorArcana/fool.webp`. The paths are misaligned with the folder structure.

### Changes

1. **Update `data.ts`** — strip the `/Cards` prefix from all image paths so they become deck-relative (e.g. `/MajorArcana/fool.webp`).

2. **Add helper** in `src/lib/decks.ts`:
   ```ts
   export function getCardImagePath(deck: string, cardImage: string): string {
     return `/Cards/${deck}${cardImage}`;
   }
   ```

3. **Update `AppProvider.tsx`** — when building the tarots array for state, apply `getCardImagePath()` using the user's preferred deck. This means all downstream components (`Tarot`, `AnimatedCard`, `OfferBlock`) receive fully resolved paths and need no changes.

4. **Deck source in AppProvider**: `AppProvider` is a client component — use `useSession()` from `next-auth/react` to read `session.user.preferredDeck`. Fall back to `"Rider-Waite"` when no session exists (anonymous users). Recompute the tarots array with resolved paths whenever the deck preference changes.

## Session & API

### JWT/Session changes (`src/lib/auth.ts`)

- **JWT callback**: read `preferredDeck` from the user record on sign-in, store in token.
- **Session callback**: expose `session.user.preferredDeck` to the client.
- **JWT update trigger**: when `session.update({ preferredDeck })` is called, persist to token (same pattern as name updates).

### New API routes

**`GET /api/user/deck`**
- Returns `{ deck: string }` — the user's current deck preference.
- Same pattern as `/api/user/plan`.

**`PATCH /api/user/deck`**
- Accepts `{ deck: string }`.
- Validates against `DECK_IDS` from the catalog.
- Updates `preferredDeck` in the DB.
- Returns `{ deck: string }`.
- Same pattern as `/api/user/profile`.

## Decks Page

### Route: `/[locale]/decks/`

New page at `src/app/[locale]/decks/page.tsx`:
- `"use client"` page wrapping `DeckSelector` in `PageShell` (same pattern as subscription page).

### Component: `src/components/DeckSelector.tsx`

Card grid layout (3 columns, one per deck). Each deck card shows:
- A sample card image (the Fool from that deck, via the `preview` field in the catalog)
- Deck name (translated from `ui.json`)
- "Selected" badge on the active deck, "Select" button on others

Behavior:
- Selecting a deck calls `PATCH /api/user/deck`, then `session.update({ preferredDeck: deck })`.
- Logged-out users see the page but selection is disabled with a prompt to sign in.

### Styles

New `src/assets/scss/blocks/_decks.scss` partial, following the subscription page styling pattern. Import in the main stylesheet.

## UserProfile Link

Add a new field row in `UserProfile.tsx` between "Current Plan" and "Password":
- Label: translated "Deck" key
- Value: current deck name (translated) + `→` link to `/decks` (same pattern as plan/upgrade link)
- Deck name fetched via `GET /api/user/deck` on mount (same pattern as plan fetching).

## Translations

Add keys to `messages/{locale}/ui.json` for all 3 locales (`en`, `no`, `ru`):

- `deck` — label for profile field
- `chooseDeck` — page heading
- `deckRiderWaite` — "Rider-Waite"
- `deckKlimt` — "Klimt"
- `deckGothicVintage` — "Gothic Vintage"
- `selected` — badge text
- `selectDeck` — button text
- `signInToSelectDeck` — prompt for anonymous users

## What's NOT in scope

- Anonymous/cookie-based deck selection (future)
- Restricting deck selection to paid subscribers (future)
- Deck previews showing multiple sample cards
- Mystical-SVG deck
- Card back customization
