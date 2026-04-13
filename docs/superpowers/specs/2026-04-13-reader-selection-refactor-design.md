# Reader Selection Refactor

## Summary

Move reader selection from inside the tarot card modal to the main page. The reader is presented as part of the pre-reading setup — the user sees who will read for them, can change the reader (subscribers only for non-default), and then summons the deck. The deck only appears after the user commits to a reader.

## Current behavior

1. User clicks deck on main page
2. Deck shakes, tarot modal opens
3. (Logged-in + English locale) Reader selection screen shown inside the modal
4. User picks a reader, then flips cards

## New behavior

### Main page — two states in OfferBlock

The OfferBlock hero section toggles between two views occupying the same space:

**Reader view (default):**
- Page title ("Discover Your Fate" etc. — existing)
- Reader presentation: avatar placeholder (initial letter in circle), display name, short bio
- Two buttons:
  - "Summon [Name]" — transitions to deck view
  - "Change your reader" — opens reader selection overlay modal

**Deck view (after "Summon"):**
- Deck card with shake animation + hand icon (existing behavior, unchanged)
- Click deck → tarot modal opens as today

When the tarot modal closes (`handleClose`), OfferBlock resets back to reader view.

### Reader selection overlay modal

Opened by "Change your reader" button. Uses the existing `Modal` component as container and repurposes the `ReaderSelection` component (already built) with these modifications:

- Shows all 3 reader cards (Vespera, Crow, Reginald)
- Current reader is visually marked as selected
- **Subscription gating on summon buttons:**
  - Default reader (Vespera): always available, summon button active
  - Other readers: 
    - Subscribers: summon button active
    - Free/anonymous users: summon button replaced with "Upgrade to unlock" which opens the subscription modal
- Selecting a reader closes the overlay and updates `selectedReader` in AppProvider state
- The main page reader presentation updates to show the newly chosen reader

### State changes

| Field | Before | After |
|-------|--------|-------|
| `AppState.selectedReader` | `ReaderId \| null` (null = not picked yet) | `ReaderId` (always set, defaults to `DEFAULT_READER`) |
| OfferBlock local state | `isDeckShaking` | `isDeckShaking` + `isDeckRevealed` (boolean, toggles reader view vs deck view) |

### Tarot.tsx cleanup

Remove entirely:
- `const localeHasReaders = !!messages?.readers;`
- `const shouldPickReader = !!session && localeHasReaders;`
- `const handleReaderSelect = ...`
- The early return that renders `ReaderSelection` inside the tarot modal
- `useMessages` and `useSession` imports (if no longer needed for other purposes — verify)

The Tarot component just uses `state.selectedReader` as-is. It's always set by this point.

### AppProvider changes

- `selectedReader` initial value: `DEFAULT_READER` instead of `null`
- Type narrows from `ReaderId | null` to `ReaderId`
- The `?? DEFAULT_READER` fallback in the `generateReading` call becomes unnecessary but harmless
- Remove the `selectedReader` doc comment about `null` meaning "hasn't picked yet"
- On modal close, `selectedReader` is NOT reset — it persists across readings within the session. The reader choice sticks until the user changes it.

### ReaderSelection.tsx modifications

Current: standalone selection screen with hover-to-focus + summon flow.

Changes needed:
- Add `currentReader: ReaderId` prop — marks which reader is already selected
- Add `onClose: () => void` prop — for modal dismiss
- Add `isSubscriber: boolean` prop — controls whether non-default readers are locked
- Add `onOpenSubscription: () => void` prop — called when "Upgrade to unlock" is clicked
- Locked readers: summon button text changes to "Upgrade to unlock", onClick calls `onOpenSubscription` instead of `onSelect`
- Selected reader card gets a visual indicator (border highlight or "Current" badge)

### New translation keys (messages/en/ui.json)

```json
{
  "yourReaderIs": "Your reader is",
  "changeYourReader": "Change your reader",
  "upgradeToUnlock": "Upgrade to unlock"
}
```

Norwegian and Russian: add the same keys (translated). These are simple UI strings, not reader voice content.

### OfferBlock.tsx changes

New local state:
- `isDeckRevealed: boolean` — false by default, set to true when "Summon" is clicked
- `isReaderModalOpen: boolean` — controls the overlay modal

New behavior:
- When `isDeckRevealed === false`: render reader presentation section instead of deck
- "Summon [Name]" button sets `isDeckRevealed = true`
- "Change your reader" button sets `isReaderModalOpen = true`
- When tarot modal closes (detect via `state.isCardsModalOpen` going from true to false): reset `isDeckRevealed = false`

Reader presentation reads from:
- `state.selectedReader` for the reader ID
- `useTranslations("readers")` for display name and bio

### Styles

**`_offer-block.scss`:**
- New `.offer-block__reader` section: centered, similar spacing to existing title area
- Avatar circle: reuse `.reader-selection__portrait` styles or define similar
- Name: prominent, same font as existing headings
- Bio: italic, muted opacity (similar to reader card tagline)
- Two buttons: "Summon" as primary CTA, "Change" as secondary/text link

**`_reader-selection.scss`:**
- Add `.reader-selection__card--locked` modifier: muted appearance, lock badge
- Add `.reader-selection__card--current` modifier: persistent highlight
- Adjust for modal container context if needed

## Files touched

| File | Change |
|------|--------|
| `src/components/OfferBlock.tsx` | Add reader view state, summon/change buttons, toggle logic |
| `src/components/ReaderSelection.tsx` | Add props for current/locked/subscription, adapt for modal use |
| `src/components/Tarot.tsx` | Remove reader selection gate and related code |
| `src/AppProvider.tsx` | `selectedReader` defaults to `DEFAULT_READER`, type no longer nullable |
| `src/assets/scss/blocks/_offer-block.scss` | Reader presentation styles |
| `src/assets/scss/blocks/_reader-selection.scss` | Locked/current card modifiers |
| `messages/en/ui.json` | New keys: yourReaderIs, changeYourReader, upgradeToUnlock |
| `src/app/[locale]/page.tsx` | Pass `onOpenSubscription` callback to OfferBlock if not already available |

## Out of scope

- Reader portraits (real art) — placeholder initials for now
- Persisting reader preference to DB — session-scoped only
- Norwegian/Russian reader voice translations — those locales use default reader templates
- Changes to the tarot card modal itself — left as-is per user request
