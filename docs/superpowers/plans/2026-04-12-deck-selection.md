# Deck Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let logged-in users choose which tarot card deck (Rider-Waite, Klimt, Gothic-Vintage) is used for their readings, stored in the database and reflected across sessions.

**Architecture:** Add `preferredDeck` string field to User model. Strip the `/Cards` prefix from `data.ts` image paths so they become deck-relative. At render time in `AppProvider`, prepend `/Cards/{deck}/` using the user's preference from their session. New `/decks` page with card-grid selector, new API routes, and a link from UserProfile.

**Tech Stack:** Next.js 14 App Router, Prisma 6, NextAuth v4 (JWT strategy), next-intl v3, SCSS

**Spec:** `docs/superpowers/specs/2026-04-12-deck-selection-design.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/lib/decks.ts` | Deck catalog, `DeckId` type, `getCardImagePath` helper |
| Create | `src/app/api/user/deck/route.ts` | GET + PATCH endpoints for deck preference |
| Create | `src/app/[locale]/decks/page.tsx` | Decks page (thin wrapper) |
| Create | `src/components/DeckSelector.tsx` | Deck selector card grid |
| Create | `src/assets/scss/blocks/_decks.scss` | Styles for deck selector |
| Modify | `src/generated/prisma/schema.prisma` | Add `preferredDeck` field to User |
| Modify | `src/data.ts` | Strip `/Cards` prefix from all image paths |
| Modify | `src/types/next-auth.d.ts` | Add `preferredDeck` to User, Session, JWT types |
| Modify | `src/lib/auth.ts` | Expose `preferredDeck` in JWT + session callbacks |
| Modify | `src/AppProvider.tsx` | Resolve card images using user's deck preference |
| Modify | `src/components/UserProfile.tsx` | Add deck row with link to `/decks` |
| Modify | `src/assets/scss/style.scss` | Import `_decks.scss` |
| Modify | `messages/en/ui.json` | Add deck-related translation keys |
| Modify | `messages/no/ui.json` | Add deck-related translation keys |
| Modify | `messages/ru/ui.json` | Add deck-related translation keys |

---

### Task 1: Deck Catalog (`src/lib/decks.ts`)

**Files:**
- Create: `src/lib/decks.ts`

- [ ] **Step 1: Create the deck catalog**

```ts
// src/lib/decks.ts

export const DECKS = {
  "Rider-Waite": { id: "Rider-Waite", preview: "/Cards/Rider-Waite/MajorArcana/fool.webp" },
  "Klimt": { id: "Klimt", preview: "/Cards/Klimt/MajorArcana/fool.webp" },
  "Gothic-Vintage": { id: "Gothic-Vintage", preview: "/Cards/Gothic-Vintage/MajorArcana/fool.webp" },
} as const;

export type DeckId = keyof typeof DECKS;
export const DECK_IDS = Object.keys(DECKS) as DeckId[];
export const DEFAULT_DECK: DeckId = "Rider-Waite";

export function getCardImagePath(deck: string, cardImage: string): string {
  return `/Cards/${deck}${cardImage}`;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no errors related to `src/lib/decks.ts`

---

### Task 2: Prisma Schema + Migration

**Files:**
- Modify: `src/generated/prisma/schema.prisma`

- [ ] **Step 1: Add `preferredDeck` to the User model**

In `src/generated/prisma/schema.prisma`, add after the `termsAcceptedAt` line inside the `User` model:

```prisma
  preferredDeck   String        @default("Rider-Waite")
```

The User model should look like:

```prisma
model User {
  id              String        @id @default(cuid())
  name            String?
  email           String?       @unique
  emailVerified   DateTime?
  password        String?
  image           String?
  createdAt       DateTime      @default(now())
  termsAcceptedAt DateTime?
  preferredDeck   String        @default("Rider-Waite")
  accounts        Account[]
  sessions        Session[]
  readings        Reading[]
  subscription    Subscription?
}
```

- [ ] **Step 2: Run the migration**

Run: `npx prisma migrate dev --name add_preferred_deck`
Expected: Migration created and applied successfully. All existing users get `"Rider-Waite"` as default.

- [ ] **Step 3: Verify the generated client**

Run: `npx prisma generate`
Expected: `Prisma Client` generated successfully.

---

### Task 3: Update `data.ts` Image Paths

**Files:**
- Modify: `src/data.ts`

- [ ] **Step 1: Strip `/Cards` prefix from all image paths**

Every `image` field currently looks like `"/Cards/MajorArcana/fool.webp"` or `"/Cards/Cups/ace_chalices.webp"`. Change them all to remove the `/Cards` prefix so they become deck-relative paths:

- `"/Cards/MajorArcana/fool.webp"` → `"/MajorArcana/fool.webp"`
- `"/Cards/Cups/ace_chalices.webp"` → `"/Cups/ace_chalices.webp"`
- `"/Cards/Swords/ace_swords.webp"` → `"/Swords/ace_swords.webp"`
- `"/Cards/Pentacles/ace_pentacles.webp"` → `"/Pentacles/ace_pentacles.webp"`
- `"/Cards/Wands/ace_wands.webp"` → `"/Wands/ace_wands.webp"`

Do a find-and-replace: `"/Cards/` → `"/` for all 78 entries.

- [ ] **Step 2: Verify the file**

Run: `grep -c '"/Cards/' src/data.ts`
Expected: `0` (no remaining `/Cards` prefixes)

Run: `grep -c '"/MajorArcana/' src/data.ts`
Expected: `22` (all major arcana cards)

---

### Task 4: NextAuth Type Declarations

**Files:**
- Modify: `src/types/next-auth.d.ts`

- [ ] **Step 1: Add `preferredDeck` to type declarations**

Replace the entire file with:

```ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    createdAt?: Date;
    preferredDeck?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      createdAt?: string;
      preferredDeck?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    createdAt?: string;
    preferredDeck?: string;
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no type errors

---

### Task 5: Auth Callbacks — Expose `preferredDeck` in Session

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Add `preferredDeck` to the credentials authorize return**

In the `authorize` function (around line 43), add `preferredDeck` to the returned user object:

```ts
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          preferredDeck: user.preferredDeck,
        };
```

- [ ] **Step 2: Add `preferredDeck` to the JWT callback**

In the `jwt` callback, after `token.createdAt` is set from the user (around line 60-63), add:

```ts
        token.preferredDeck = user.preferredDeck ?? "Rider-Waite";
```

Also, add a handler for the `"update"` trigger for `preferredDeck`. The existing update block (line 64-66) handles `name`. Extend it:

Change:
```ts
      if (trigger === "update" && updateData?.name) {
        token.name = updateData.name;
      }
```

To:
```ts
      if (trigger === "update") {
        if (updateData?.name) {
          token.name = updateData.name;
        }
        if (updateData?.preferredDeck) {
          token.preferredDeck = updateData.preferredDeck;
        }
      }
```

- [ ] **Step 3: Add `preferredDeck` to the session callback**

In the `session` callback (around line 69-78), add after `session.user.name` is set:

```ts
        session.user.preferredDeck = token.preferredDeck as string | undefined;
```

The full session callback should be:

```ts
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.createdAt = token.createdAt;
        if (token.name) {
          session.user.name = token.name as string;
        }
        session.user.preferredDeck = token.preferredDeck as string | undefined;
      }
      return session;
    },
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no type errors

---

### Task 6: API Routes for Deck Preference

**Files:**
- Create: `src/app/api/user/deck/route.ts`

- [ ] **Step 1: Create the GET + PATCH route**

```ts
// src/app/api/user/deck/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DECK_IDS } from "@/lib/decks";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredDeck: true },
  });

  return NextResponse.json({ deck: user?.preferredDeck ?? "Rider-Waite" });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deck } = await request.json();

  if (typeof deck !== "string" || !DECK_IDS.includes(deck as any)) {
    return NextResponse.json(
      { error: "Invalid deck" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredDeck: deck },
  });

  return NextResponse.json({ deck });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no type errors

---

### Task 7: Update `AppProvider` — Resolve Card Images by Deck

**Files:**
- Modify: `src/AppProvider.tsx`

- [ ] **Step 1: Import dependencies and resolve card images dynamically**

Replace the entire `AppProvider.tsx` with:

```tsx
import React, {createContext, ReactNode, useContext, useEffect, useMemo, useState} from 'react';
import {useMessages} from "next-intl";
import {useSession} from "next-auth/react";
import {Card} from "@/types/Types";
import {tarots} from "@/data";
import {generateReading} from "@/lib/generateReading";
import {getCardImagePath, DEFAULT_DECK} from "@/lib/decks";

type AppState = {
    tarots: Card[];
    chosenCards: Card[];
    resetFlipped: boolean;
    isPredictionReady: boolean;
    response: string;
    isResponseLoading: boolean;
    isCardsModalOpen: boolean;
    shakeCount: number;
};

type AppContextType = {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
};

const AppContext = createContext<AppContextType>({
    state: {
        tarots: [],
        chosenCards: [],
        resetFlipped: false,
        isPredictionReady: false,
        response: '',
        isResponseLoading: false,
        isCardsModalOpen: false,
        shakeCount: 0,
    },
    setState: () => {},
});

type AppProviderProps = {
    children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
    const { data: session } = useSession();
    const deck = session?.user?.preferredDeck ?? DEFAULT_DECK;

    const resolvedTarots = useMemo(() =>
        tarots.map(card => ({
            ...card,
            image: getCardImagePath(deck, card.image),
        })),
        [deck]
    );

    const [state, setState] = useState<AppState>({
        tarots: resolvedTarots,
        chosenCards: [],
        resetFlipped: false,
        isPredictionReady: false,
        response: '',
        isResponseLoading: false,
        isCardsModalOpen: false,
        shakeCount: 0,
    });

    const messages = useMessages();

    // Update tarots when deck changes
    useEffect(() => {
        setState(prev => ({ ...prev, tarots: resolvedTarots }));
    }, [resolvedTarots]);

    useEffect(() => {
        if (state.chosenCards.length > 0) {
            setState(prevState => ({
                ...prevState,
                resetFlipped: true,
                isPredictionReady: false,
                isResponseLoading: true,
            }));

            const response = generateReading(
                state.chosenCards,
                messages as any,
                (messages as any).ui?.drawThreeCards ?? "Draw three cards to receive your reading.",
                (messages as any).ui?.spiritsUnclear ?? "The spirits are unclear. Please draw again.",
            );
            setState(prevState => ({
                ...prevState,
                isResponseLoading: false,
                response: response,
            }));
        }
    }, [state.chosenCards, messages]);

    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
```

Key changes from the original:
- Import `useSession` from `next-auth/react`
- Import `getCardImagePath` and `DEFAULT_DECK` from `@/lib/decks`
- Read `deck` from session, default to `DEFAULT_DECK`
- Use `useMemo` to build `resolvedTarots` with full image paths
- Use `useEffect` to update state when deck changes
- Default context uses empty tarots array (gets populated in the provider)

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no type errors

---

### Task 8: Translations — Add Deck Keys to All Locales

**Files:**
- Modify: `messages/en/ui.json`
- Modify: `messages/no/ui.json`
- Modify: `messages/ru/ui.json`

- [ ] **Step 1: Add English translations**

Add these keys inside the `"ui"` object in `messages/en/ui.json`, after the `"language"` key:

```json
    "deck": "Deck",
    "chooseDeck": "Choose Your Deck",
    "deckRiderWaite": "Rider-Waite",
    "deckKlimt": "Klimt",
    "deckGothicVintage": "Gothic Vintage",
    "selected": "Selected",
    "selectDeck": "Select",
    "signInToSelectDeck": "Sign in to choose your deck"
```

- [ ] **Step 2: Add Norwegian translations**

Add these keys inside the `"ui"` object in `messages/no/ui.json`, after the `"language"` key:

```json
    "deck": "Kortstokk",
    "chooseDeck": "Velg Din Kortstokk",
    "deckRiderWaite": "Rider-Waite",
    "deckKlimt": "Klimt",
    "deckGothicVintage": "Gotisk Vintage",
    "selected": "Valgt",
    "selectDeck": "Velg",
    "signInToSelectDeck": "Logg inn for å velge kortstokk"
```

- [ ] **Step 3: Add Russian translations**

Add these keys inside the `"ui"` object in `messages/ru/ui.json`, after the `"language"` key:

```json
    "deck": "Колода",
    "chooseDeck": "Выбери свою Колоду",
    "deckRiderWaite": "Райдер-Уэйт",
    "deckKlimt": "Климт",
    "deckGothicVintage": "Готический Винтаж",
    "selected": "Выбрано",
    "selectDeck": "Выбрать",
    "signInToSelectDeck": "Войдите, чтобы выбрать колоду"
```

---

### Task 9: Deck Selector Styles

**Files:**
- Create: `src/assets/scss/blocks/_decks.scss`
- Modify: `src/assets/scss/style.scss`

- [ ] **Step 1: Create the deck selector stylesheet**

```scss
// src/assets/scss/blocks/_decks.scss
.decks {
  position: relative;
  padding: 160px 0 100px;
  background-color: $dark-bg;
  color: $primary;
  font-family: $font-family;
  font-weight: $general-font-weight;

  .container {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px;
    z-index: 1;
  }

  &__header {
    text-align: center;
    margin-bottom: 56px;
  }

  &__title {
    font-size: 2.5rem;
    font-weight: $general-font-weight;
    letter-spacing: 0.04em;
    margin: 0 0 16px;
    color: $primary;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  &__card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(9, 9, 9, 0.6);
    border: $border;
    border-radius: $border-radius;
    padding: 28px;
    transition: border-color 0.2s ease;

    &--selected {
      border: 1px solid $primary;
    }
  }

  &__preview {
    width: 160px;
    height: auto;
    margin-bottom: 20px;
    border-radius: 4px;
  }

  &__card-name {
    font-size: 1.25rem;
    font-weight: $general-font-weight;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin: 0 0 20px;
    color: $primary;
    text-align: center;
  }

  &__badge {
    position: absolute;
    top: -12px;
    right: 20px;
    background: $dark-bg;
    color: $primary;
    border: 1px solid $primary;
    border-radius: $border-radius;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 4px 10px;
    font-weight: $general-font-weight;
  }

  &__cta {
    background: transparent;
    color: $primary;
    border: 1px solid $primary;
    border-radius: $border-radius;
    padding: 12px 20px;
    font-family: $font-family;
    font-size: 0.95rem;
    font-weight: $general-font-weight;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.2s ease, background-color 0.2s ease;
    margin-top: auto;

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  &__sign-in-prompt {
    text-align: center;
    margin-top: 32px;
    font-size: 1rem;
    opacity: 0.75;
  }

  @media (max-width: 720px) {
    padding: 120px 0 80px;

    &__title {
      font-size: 1.9rem;
    }

    &__grid {
      grid-template-columns: 1fr;
    }

    &__preview {
      width: 140px;
    }
  }
}
```

- [ ] **Step 2: Import in main stylesheet**

In `src/assets/scss/style.scss`, add after the `_subscription` import (line 23):

```scss
@import "blocks/_decks";
```

---

### Task 10: Deck Selector Component

**Files:**
- Create: `src/components/DeckSelector.tsx`

- [ ] **Step 1: Create the DeckSelector component**

```tsx
// src/components/DeckSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { DECKS, DECK_IDS, DEFAULT_DECK, type DeckId } from "@/lib/decks";

const DECK_NAME_KEYS: Record<DeckId, string> = {
  "Rider-Waite": "deckRiderWaite",
  "Klimt": "deckKlimt",
  "Gothic-Vintage": "deckGothicVintage",
};

export const DeckSelector = () => {
  const { data: session, update } = useSession();
  const t = useTranslations("ui");
  const [currentDeck, setCurrentDeck] = useState<string>(DEFAULT_DECK);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/user/deck")
      .then((res) => res.json())
      .then((data) => setCurrentDeck(data.deck ?? DEFAULT_DECK))
      .catch(() => {});
  }, [session]);

  const handleSelect = async (deckId: DeckId) => {
    if (deckId === currentDeck || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/deck", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: deckId }),
      });
      if (res.ok) {
        setCurrentDeck(deckId);
        await update({ preferredDeck: deckId });
      }
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="decks">
      <div className="container">
        <header className="decks__header">
          <h1 className="decks__title">{t("chooseDeck")}</h1>
        </header>

        <div className="decks__grid">
          {DECK_IDS.map((id) => {
            const deck = DECKS[id];
            const isSelected = id === currentDeck;
            const cardClass = isSelected
              ? "decks__card decks__card--selected"
              : "decks__card";

            return (
              <article key={id} className={cardClass}>
                {isSelected && (
                  <span className="decks__badge">{t("selected")}</span>
                )}
                <Image
                  className="decks__preview"
                  src={deck.preview}
                  alt={t(DECK_NAME_KEYS[id])}
                  width={160}
                  height={280}
                />
                <h2 className="decks__card-name">{t(DECK_NAME_KEYS[id])}</h2>
                {session ? (
                  <button
                    type="button"
                    className="decks__cta"
                    disabled={isSelected || isSaving}
                    onClick={() => handleSelect(id)}
                  >
                    {isSelected ? t("selected") : t("selectDeck")}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>

        {!session && (
          <p className="decks__sign-in-prompt">{t("signInToSelectDeck")}</p>
        )}
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no type errors

---

### Task 11: Decks Page

**Files:**
- Create: `src/app/[locale]/decks/page.tsx`

- [ ] **Step 1: Create the decks page**

```tsx
// src/app/[locale]/decks/page.tsx
"use client";

import { PageShell } from "@/components/PageShell";
import { DeckSelector } from "@/components/DeckSelector";

export default function DecksPage() {
  return (
    <PageShell>
      <DeckSelector />
    </PageShell>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no type errors

---

### Task 12: UserProfile — Add Deck Link

**Files:**
- Modify: `src/components/UserProfile.tsx`

- [ ] **Step 1: Add deck state and fetch**

Add a new state variable after the `planId` state (around line 24):

```ts
  const [deckId, setDeckId] = useState<string | null>(null);
```

Add a new `useEffect` after the plan-loading effect (after line 56):

```ts
  useEffect(() => {
    async function loadDeck() {
      try {
        const res = await fetch("/api/user/deck");
        if (res.ok) {
          const data = await res.json();
          setDeckId(data.deck);
        }
      } catch {
        // silent — UI falls back to "—"
      }
    }
    loadDeck();
  }, []);
```

- [ ] **Step 2: Add the deck field row in the JSX**

Insert a new field row after the "Current Plan" field (after the closing `</div>` of the plan field, around line 233) and before the "Password" field:

```tsx
      <div className="user-profile__field">
        <span className="user-profile__label">{t("deck")}</span>
        <span className="user-profile__value">
          {deckId === "Rider-Waite" ? t("deckRiderWaite") :
           deckId === "Klimt" ? t("deckKlimt") :
           deckId === "Gothic-Vintage" ? t("deckGothicVintage") : "—"}
          <Link
            href="/decks"
            className="user-profile__upgrade"
            onClick={() => onClose?.()}
          >
            {"→ " + t("chooseDeck")}
          </Link>
        </span>
      </div>
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: no type errors

---

### Task 13: Build Verification + Manual Test

- [ ] **Step 1: Run the full build**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Test the following:
1. Visit `/en/decks` — should see 3 deck cards in a grid
2. Without logging in, deck select buttons should not appear; "Sign in to choose your deck" message shown
3. Log in, visit `/en/decks` — should see "Selected" badge on Rider-Waite
4. Click "Select" on Klimt — should update to show Klimt as selected
5. Go to main page, shake the deck — card images should use Klimt artwork (`/Cards/Klimt/...`)
6. Open user profile — should see "Deck" row showing "Klimt" with link to decks page
7. Click the deck link in profile — navigates to `/en/decks`
8. Test with `/no/decks` and `/ru/decks` — translations should display correctly
