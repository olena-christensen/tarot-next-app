# Reader Selection Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move reader selection from inside the tarot modal to the main page as a persistent "Your reader is..." section, with the deck appearing only after the user clicks "Summon."

**Architecture:** OfferBlock gains a two-state view (reader presentation vs deck), controlled by local `isDeckRevealed` state. ReaderSelection is repurposed as overlay modal content with subscription gating. Tarot.tsx loses all reader selection logic. AppProvider's `selectedReader` becomes non-nullable, defaulting to `DEFAULT_READER`.

**Tech Stack:** React 18, Next.js 14 App Router, next-intl v3, NextAuth v4, SCSS (BEM)

**IMPORTANT:** NEVER run git add, git commit, git stage, or any git write operation. The user handles all git in WebStorm. Read-only git commands only.

---

### Task 1: Update AppProvider — make `selectedReader` non-nullable

**Files:**
- Modify: `src/AppProvider.tsx`

- [ ] **Step 1: Change the type and default value**

In `src/AppProvider.tsx`, replace the `selectedReader` field in the `AppState` type and all initial values:

```tsx
// In AppState type (line 29), change:
selectedReader: ReaderId | null;
// To:
selectedReader: ReaderId;
```

Replace the doc comment block (lines 19-28) with:

```tsx
    /** Reader voice used for generateReading. Always set, defaults to DEFAULT_READER. */
    selectedReader: ReaderId;
```

In both `createContext` default (line 48) and `useState` initial (line 77), change:

```tsx
selectedReader: null,
// To:
selectedReader: DEFAULT_READER,
```

- [ ] **Step 2: Clean up the generateReading call**

In `src/AppProvider.tsx` line 101, change:

```tsx
state.selectedReader ?? DEFAULT_READER,
```

To:

```tsx
state.selectedReader,
```

- [ ] **Step 3: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds. TypeScript may flag Tarot.tsx comparing `selectedReader` to `null` — that's fine, we fix it in Task 3.

---

### Task 2: Add new translation keys

**Files:**
- Modify: `messages/en/ui.json`

- [ ] **Step 1: Add reader-related UI keys**

In `messages/en/ui.json`, add these keys inside the `"ui"` object (after the `"summonReader"` line):

```json
    "yourReaderIs": "Your Reader",
    "changeYourReader": "Change Your Reader",
    "upgradeToUnlock": "Upgrade to Unlock"
```

---

### Task 3: Remove reader selection from Tarot.tsx

**Files:**
- Modify: `src/components/Tarot.tsx`

- [ ] **Step 1: Remove reader-related imports and logic**

In `src/components/Tarot.tsx`:

Remove these imports (lines 7-8, 15-16):

```tsx
import { useTranslations, useMessages } from "next-intl";
import { useSession } from "next-auth/react";
```

Replace with:

```tsx
import { useTranslations } from "next-intl";
```

Remove import (line 15):

```tsx
import {ReaderSelection} from "@/components/ReaderSelection";
import type {ReaderId} from "@/lib/readers";
```

- [ ] **Step 2: Remove reader-related state and hooks**

Remove these lines from the component body (lines 20-21):

```tsx
const { data: session } = useSession();
const messages = useMessages() as any;
```

- [ ] **Step 3: Remove reader reset from handleClose**

In `handleClose` (around line 55-57), remove:

```tsx
            // Reset reader so the next session re-prompts the selection screen
            // (for users who actually see it).
            selectedReader: null,
```

Remove `selectedReader` from the setState call entirely. The reader persists across readings now.

- [ ] **Step 4: Remove the reader selection gate block**

Remove the entire block (lines 105-133) that includes:

```tsx
const localeHasReaders = !!messages?.readers;
const shouldPickReader = !!session && localeHasReaders;

const handleReaderSelect = (readerId: ReaderId) => {
    setState(prev => ({ ...prev, selectedReader: readerId }));
};

if (shouldPickReader && state.selectedReader === null) {
    return (
        <div className="tarot-modal">
            ...ReaderSelection...
        </div>
    );
}

// For users who don't pick a reader...
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds with no type errors.

---

### Task 4: Adapt ReaderSelection for modal use with subscription gating

**Files:**
- Modify: `src/components/ReaderSelection.tsx`

- [ ] **Step 1: Update props interface**

In `src/components/ReaderSelection.tsx`, replace the current `ReaderSelectionProps` interface:

```tsx
interface ReaderSelectionProps {
  /** Called when the user commits to a reader. Parent advances the flow. */
  onSelect: (readerId: ReaderId) => void;
}
```

With:

```tsx
interface ReaderSelectionProps {
  /** Called when the user commits to a reader. */
  onSelect: (readerId: ReaderId) => void;
  /** Currently active reader — shown with a visual indicator. */
  currentReader: ReaderId;
  /** Whether the user has a paid subscription (unlocks non-default readers). */
  isSubscriber: boolean;
  /** Called when a locked reader's "Upgrade to unlock" is clicked. */
  onOpenSubscription: () => void;
}
```

- [ ] **Step 2: Update the component signature and add lock logic**

Replace the component function up through the `handleSummon`:

```tsx
export const ReaderSelection = ({
  onSelect,
  currentReader,
  isSubscriber,
  onOpenSubscription,
}: ReaderSelectionProps) => {
  const t = useTranslations("ui");
  const tReader = useTranslations("readers");
  const [focused, setFocused] = useState<ReaderId | null>(null);

  const focusedReader = focused ? READERS[focused] : null;

  const isLocked = (id: ReaderId) =>
    id !== DEFAULT_READER && !isSubscriber;

  const handleSummon = () => {
    if (!focused) return;
    if (isLocked(focused)) {
      onOpenSubscription();
    } else {
      onSelect(focused);
    }
  };
```

Add the `DEFAULT_READER` import at the top:

```tsx
import { READERS, READER_IDS, DEFAULT_READER, type ReaderId } from "@/lib/readers";
```

- [ ] **Step 3: Add current-reader and locked visual states to the card buttons**

Replace the className logic in the button (around line 63-67):

```tsx
className={[
  "reader-selection__card",
  isFocused ? "reader-selection__card--focused" : "",
  id === currentReader ? "reader-selection__card--current" : "",
  isLocked(id) ? "reader-selection__card--locked" : "",
].filter(Boolean).join(" ")}
```

- [ ] **Step 4: Update the summon button text for locked readers**

Replace the summon pane content (the `{focusedReader ? (` block, around lines 105-120):

```tsx
{focusedReader ? (
  <>
    <p className="reader-selection__bio">
      {tReader(`${focused}.bio`)}
    </p>
    <button
      type="button"
      className={`reader-selection__summon-btn${
        isLocked(focused!) ? " reader-selection__summon-btn--locked" : ""
      }`}
      onClick={handleSummon}
    >
      {isLocked(focused!)
        ? t("upgradeToUnlock")
        : focused === currentReader
          ? t("summonReader", { name: tReader(`${focused}.displayName`) })
          : t("summonReader", { name: tReader(`${focused}.displayName`) })}
    </button>
  </>
) : (
  <p className="reader-selection__placeholder">{t("hoverToLearn")}</p>
)}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds. OfferBlock doesn't use the new props yet so we won't test visually until Task 6.

---

### Task 5: Add reader presentation and locked card styles

**Files:**
- Modify: `src/assets/scss/blocks/_offer-block.scss`
- Modify: `src/assets/scss/blocks/_reader-selection.scss`

- [ ] **Step 1: Add reader presentation styles to `_offer-block.scss`**

Add before the closing `}` of `.offer-block` (before the `@keyframes` block at line 206):

```scss
  .offer-block__reader {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 0 24px;
    text-align: center;
    opacity: 0;
    animation: offerBlockCardBlockAnimation 5s forwards;
    animation-delay: 8s;
  }

  .offer-block__reader-portrait {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 40%,
      var(--reader-accent, #{$primary}),
      $dark-bg 80%
    );
    border: 1px solid var(--reader-accent, #{$primary});
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .offer-block__reader-initial {
    font-family: $font-family;
    font-size: 2.75rem;
    font-weight: $general-font-weight;
    line-height: 1;
    color: $primary;
  }

  .offer-block__reader-label {
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: $primary;
    opacity: 0.55;
    margin: 0;
  }

  .offer-block__reader-name {
    font-size: 1.6rem;
    font-weight: $general-font-weight;
    letter-spacing: 0.04em;
    color: $primary;
    margin: 0;
  }

  .offer-block__reader-bio {
    font-size: 0.95rem;
    line-height: 1.6;
    color: $primary;
    opacity: 0.7;
    font-style: italic;
    margin: 0;
    max-width: 480px;
  }

  .offer-block__reader-actions {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }

  .offer-block__summon-btn {
    appearance: none;
    background: transparent;
    color: var(--reader-accent, #{$primary});
    border: 1px solid var(--reader-accent, #{$primary});
    border-radius: $border-radius;
    padding: 14px 32px;
    font-family: $font-family;
    font-size: 0.9rem;
    font-weight: $general-font-weight;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      background-color 0.25s ease,
      color 0.25s ease,
      box-shadow 0.25s ease,
      letter-spacing 0.25s ease;

    &:hover,
    &:focus-visible {
      color: $primary;
      background: rgba(250, 225, 163, 0.06);
      box-shadow: 0 0 24px -4px var(--reader-accent, #{$primary});
      letter-spacing: 0.22em;
      outline: none;
    }

    &:active {
      transform: translateY(1px);
    }
  }

  .offer-block__change-btn {
    appearance: none;
    background: transparent;
    border: none;
    color: $primary;
    opacity: 0.5;
    font-family: $font-family;
    font-size: 0.8rem;
    font-weight: $general-font-weight;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 4px;
    transition: opacity 0.2s ease;

    &:hover,
    &:focus-visible {
      opacity: 0.85;
      outline: none;
    }
  }
```

- [ ] **Step 2: Add skip-intro for the reader section in the existing skip-intro block**

In `_offer-block.scss`, find the `&.skip-intro` block (around line 166-174). Add `.offer-block__reader` to the selector list:

```scss
  &.skip-intro {
    .offer-block__title,
    .moon,
    .offer-block__screen--cards,
    .offer-block__reader,
    .smoke-animation {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
    }
  }
```

(This replaces the separate rule added in Step 1 — remove the `&.skip-intro .offer-block__reader` block from Step 1 if you added it there.)

- [ ] **Step 3: Add locked and current card modifiers to `_reader-selection.scss`**

Add at the end of `_reader-selection.scss`, before the `@media` block:

```scss
  &__card--current {
    border-color: var(--card-accent);

    &::after {
      content: "";
      position: absolute;
      top: 12px;
      right: 12px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--card-accent);
      box-shadow: 0 0 8px var(--card-accent);
    }
  }

  &__card--locked {
    opacity: 0.6;

    &::after {
      content: "★";
      position: absolute;
      top: 10px;
      right: 12px;
      font-size: 0.75rem;
      color: var(--card-accent);
      opacity: 0.8;
    }
  }

  &__summon-btn--locked {
    border-style: dashed;
    opacity: 0.7;
  }
```

---

### Task 6: Refactor OfferBlock — two-state view (reader vs deck)

**Files:**
- Modify: `src/components/OfferBlock.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/components/OfferBlock.tsx`, add:

```tsx
import { useTranslations, useMessages } from "next-intl";
```

Change the existing `useTranslations` import to include `useMessages`:

```tsx
import { useTranslations, useMessages } from "next-intl";
```

Add reader imports:

```tsx
import {READERS, DEFAULT_READER} from "@/lib/readers";
import {ReaderSelection} from "@/components/ReaderSelection";
import {Modal} from "@/components/Modal";
```

- [ ] **Step 2: Add local state for deck reveal and reader modal**

Inside the component, after the existing `useState` calls (after line 41), add:

```tsx
const [isDeckRevealed, setIsDeckRevealed] = useState(false);
const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
const [isSubscriber, setIsSubscriber] = useState(false);
const messages = useMessages() as any;
const tReader = useTranslations("readers");
```

Update the existing `planId` effect to also derive subscriber status. Replace the fetch effect (lines 47-53):

```tsx
useEffect(() => {
    if (session) {
        fetch("/api/user/plan")
            .then((res) => res.json())
            .then((data) => {
                const id = data.planId ?? "FREE";
                setPlanId(id);
                setIsSubscriber(id !== "FREE");
            })
            .catch(() => {
                setPlanId("FREE");
                setIsSubscriber(false);
            });
    }
}, [session]);
```

- [ ] **Step 3: Reset deck view when tarot modal closes**

Add an effect after the existing effects:

```tsx
useEffect(() => {
    if (!state.isCardsModalOpen && isDeckRevealed) {
        setIsDeckRevealed(false);
    }
}, [state.isCardsModalOpen]);
```

- [ ] **Step 4: Add handleSummon and handleReaderChange handlers**

After `handleClick`, add:

```tsx
const handleSummon = () => {
    setIsDeckRevealed(true);
};

const handleReaderSelect = (readerId: typeof state.selectedReader) => {
    setState(prev => ({ ...prev, selectedReader: readerId }));
    setIsReaderModalOpen(false);
};
```

- [ ] **Step 5: Add reader presentation to the render**

In the JSX, replace the `offer-block__screen--cards` div (lines 95-127) with a conditional:

```tsx
{isDeckRevealed ? (
    <div className="offer-block__screen offer-block__screen--cards">
        <div className="offer-block__screen-bg">
            <div className="offer-block__screen-bg-inner-wrap">
                <Medallion1/>
                <Medallion2/>
            </div>
            <div className="offer-block__screen-bg-inner-wrap">
                <Medallion3/>
                <Medallion4/>
            </div>
            <div className="offer-block__screen-bg-inner-wrap">
                <Medallion5/>
                <Medallion6/>
            </div>
        </div>
        <div className="inner-wrap">
            <div
                className="center"
                onClick={() => {
                    handleClick();
                }}
            >
                <AnimatedCard
                    frontUrl="/decor-img/card.webp"
                    backUrl="/decor-img/card1.webp"
                    isDeckShaking={isDeckShaking}
                    isGlowing={!isDeckShaking && !state.isCardsModalOpen}
                    animation="cardTwistAnimation 3s infinite"
                />
                <div className="hand"><Hand/></div>
            </div>
        </div>
    </div>
) : (
    <div
        className="offer-block__screen offer-block__screen--cards"
    >
        <div className="offer-block__screen-bg">
            <div className="offer-block__screen-bg-inner-wrap">
                <Medallion1/>
                <Medallion2/>
            </div>
            <div className="offer-block__screen-bg-inner-wrap">
                <Medallion3/>
                <Medallion4/>
            </div>
            <div className="offer-block__screen-bg-inner-wrap">
                <Medallion5/>
                <Medallion6/>
            </div>
        </div>
        <div className="offer-block__reader"
             style={{ "--reader-accent": READERS[state.selectedReader].aura } as React.CSSProperties}
        >
            <div className="offer-block__reader-portrait" aria-hidden="true">
                <span className="offer-block__reader-initial">
                    {messages?.readers
                        ? tReader(`${state.selectedReader}.displayName`).charAt(0)
                        : "V"}
                </span>
            </div>
            <p className="offer-block__reader-label">{t("yourReaderIs")}</p>
            <h2 className="offer-block__reader-name">
                {messages?.readers
                    ? tReader(`${state.selectedReader}.displayName`)
                    : "Madame Vespera"}
            </h2>
            <p className="offer-block__reader-bio">
                {messages?.readers
                    ? tReader(`${state.selectedReader}.tagline`)
                    : ""}
            </p>
            <div className="offer-block__reader-actions">
                <button
                    type="button"
                    className="offer-block__summon-btn"
                    onClick={handleSummon}
                >
                    {t("summonReader", {
                        name: messages?.readers
                            ? tReader(`${state.selectedReader}.displayName`)
                            : "Madame Vespera"
                    })}
                </button>
                {session && messages?.readers && (
                    <button
                        type="button"
                        className="offer-block__change-btn"
                        onClick={() => setIsReaderModalOpen(true)}
                    >
                        {t("changeYourReader")}
                    </button>
                )}
            </div>
        </div>
    </div>
)}
```

- [ ] **Step 6: Add the reader selection modal**

Before the closing `</>` (before `<Footer />`), add:

```tsx
{messages?.readers && (
    <Modal
        title={t("chooseYourReader")}
        isOpen={isReaderModalOpen}
        onClose={() => setIsReaderModalOpen(false)}
        wide
    >
        <ReaderSelection
            onSelect={handleReaderSelect}
            currentReader={state.selectedReader}
            isSubscriber={isSubscriber}
            onOpenSubscription={() => {
                setIsReaderModalOpen(false);
                onOpenSubscription();
            }}
        />
    </Modal>
)}
```

- [ ] **Step 7: Verify build and test manually**

Run: `npm run build`
Expected: Build succeeds.

Run: `npm run dev`
Manual test:
1. Main page shows reader presentation (avatar, name, tagline, "Summon" button)
2. Clicking "Summon" reveals the deck
3. Clicking deck → shakes → tarot modal (no reader selection inside)
4. Closing modal → back to reader presentation
5. "Change your reader" opens overlay with 3 readers
6. Non-default readers show "Upgrade to unlock" for free users

---

### Task 7: Update CLAUDE.md documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update Reader Selection section**

In `CLAUDE.md`, update the Reader Selection section to reflect the new flow:

- Reader selection is on the main page, not in the tarot modal
- "Summon" reveals the deck, "Change your reader" opens overlay modal
- Subscription gating: non-default readers require paid plan
- `selectedReader` is non-nullable, defaults to `DEFAULT_READER`
- Reader persists across readings within the session

- [ ] **Step 2: Update the reading reveal flow**

Remove step 0 (reader selection inside modal) from the Animations section, since it no longer happens there.
