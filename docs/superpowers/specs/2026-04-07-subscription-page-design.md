# Subscription Page — Design Spec

**Date:** 2026-04-07
**Status:** Approved, ready for implementation plan

## Goal

Add a `/subscription` page that presents pricing tiers for the Tarot app, plus the underlying data model so payments can be wired in later. No payment provider is integrated in this spec — CTAs are disabled with "Coming soon".

## Terminology

- **Reading** — one tarot draw/prediction (replaces "shake" in user-facing copy)
- **Diviner** — the persona / reader who delivers the reading
- **Deck** — a tarot card deck

## Plans

Static plan catalog defined in `src/lib/plans.ts` as a typed constant. The DB only tracks which plan a user is on, not the plan catalog itself.

| Plan      | Price        | Readings        | History | Choose deck | Choose diviner | Extras                                              |
| --------- | ------------ | --------------- | ------- | ----------- | -------------- | --------------------------------------------------- |
| Free      | $0           | 3/day, midnight reset (user local time) | ❌      | ❌          | ❌             | —                                                   |
| Single    | $1 one-time  | +1 extra reading | ❌      | ❌          | ❌             | —                                                   |
| Monthly   | $10/mo       | Unlimited       | ✅      | ✅          | ✅             | Long-form readings, daily card email, PDF export, favorites + notes, reminder notifications, ad-free |
| Yearly    | $50/yr       | Unlimited       | ✅      | ✅          | ✅             | All Monthly perks, plus exclusive seasonal decks, early access to new diviners/decks |

Yearly saves ~58% vs monthly ($120/yr → $50/yr).

**Note:** The features marked above are what each *paid plan unlocks* once they exist. This spec only ships the **pricing page UI + DB schema + account indicator**. Free-tier enforcement, history storage, deck selection, and diviner selection are intentionally **out of scope** and will be tracked as separate specs.

## Scope

### In scope
1. Pricing page at `/subscription` (Layout B — Hero split)
2. Plan catalog config (`src/lib/plans.ts`)
3. Prisma `Subscription` model + migration
4. Helper `getUserPlan(userId)` returning current plan id (defaults to `FREE`)
5. "Current plan" section in the `UserProfile` modal with an "Upgrade →" link
6. "Pricing" link in `MainMenu`

### Out of scope (future specs)
- Payment provider integration
- Free-tier enforcement (counting and blocking the 4th reading)
- Reading history storage and UI
- Deck selection UI and data model
- Diviner selection UI and data model
- Email collection / notify-me modal

## Visual Design — Layout B (Hero split)

The page focuses the user's attention on Monthly vs Yearly head-to-head, with Free mentioned subtly and Single Reading offered as a small "top-up" row.

```
┌──────────────────────────────────────────────────────┐
│           Choose your path                           │
│      Subtitle: a brief value-prop sentence           │
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │ Single reading             One extra  $1    │   │
│   └─────────────────────────────────────────────┘   │
│                                                      │
│   ┌─────────────────┐      ┌───────────────────┐    │
│   │ Monthly         │      │ Yearly  SAVE 58%  │    │
│   │ $10/mo          │      │ $50/yr            │    │
│   │ ✓ Unlimited     │      │ ✓ Everything in   │    │
│   │ ✓ History       │      │   Monthly         │    │
│   │ ✓ Decks &       │      │ ✓ Exclusive decks │    │
│   │   Diviners      │      │ ✓ Early access    │    │
│   │ [Coming soon]   │      │ [Coming soon]     │    │
│   └─────────────────┘      └───────────────────┘    │
│                                                      │
│      Free: 3 readings/day — no signup needed         │
└──────────────────────────────────────────────────────┘
```

**CTA behavior:** All upgrade buttons render disabled with a tooltip "Payments launching soon". No email capture in this iteration.

**Mobile:** Monthly and Yearly stack vertically, Single-reading row stays full-width, Free footnote stays at the bottom.

## Architecture

### File additions / changes

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/app/subscription/page.tsx` | new | Server component, renders `<SubscriptionPlans/>` |
| `src/components/SubscriptionPlans.tsx` | new | Client component, renders the 4-tier layout |
| `src/lib/plans.ts` | new | Static plan catalog (typed) |
| `src/lib/subscription.ts` | new | `getUserPlan(userId)` helper |
| `src/assets/scss/_subscription.scss` | new | Styles, imported from main scss entry |
| `src/generated/prisma/schema.prisma` | edit | Add `PlanId` enum, `Subscription` model, relation on `User` |
| `src/components/UserProfile.tsx` | edit | Add "Current plan" row + Upgrade link |
| `src/components/MainMenu.tsx` | edit | Add "Pricing" link |

### Data model

```prisma
enum PlanId {
  FREE
  SINGLE
  MONTHLY
  YEARLY
}

model Subscription {
  id        String    @id @default(cuid())
  userId    String    @unique
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId    PlanId    @default(FREE)
  startedAt DateTime  @default(now())
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// On the User model, add:
//   subscription Subscription?
```

`expiresAt` is `null` for `FREE`. For `MONTHLY` and `YEARLY` it represents the end of the current paid period — kept now so payment integration doesn't require another migration.

### Plan catalog shape (`src/lib/plans.ts`)

```ts
export type PlanId = 'FREE' | 'SINGLE' | 'MONTHLY' | 'YEARLY';

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;       // "$10/mo", "$50/yr", "$1", "$0"
  interval: 'one-time' | 'month' | 'year' | null;
  features: string[];
  highlight?: boolean;      // marks "popular"/"best value"
};

export const PLANS: Record<PlanId, Plan> = { /* ... */ };
```

### Helper (`src/lib/subscription.ts`)

```ts
export async function getUserPlan(userId: string): Promise<PlanId> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.planId ?? 'FREE';
}
```

No row is created on signup — absence implies `FREE`. This keeps the migration zero-touch for existing users.

### UserProfile change

Add a section to the existing modal:

```
Current plan: Free
[Upgrade →]   ← links to /subscription, closes modal on click
```

The plan label is fetched server-side via `getUserPlan` and passed in as a prop, or fetched in a small server action — whichever the existing component pattern uses. (Implementation plan will resolve this after reading `UserProfile.tsx`.)

## Error handling

- `getUserPlan` failures (DB unreachable) → caught, return `FREE`. No user-visible error; logs to console.
- The `/subscription` page itself is a static server component — no runtime errors expected.

## Testing

Manual verification only for this spec — no automated tests added (matches current project conventions: no test suite exists in the repo today).

Manual checklist:
- [ ] `/subscription` renders all 4 tiers, layout matches Hero split design
- [ ] Mobile view stacks Monthly/Yearly vertically
- [ ] All upgrade CTAs are disabled, tooltip shows on hover
- [ ] `MainMenu` shows "Pricing" link, navigates to `/subscription`
- [ ] `UserProfile` modal shows "Current plan: Free" for any logged-in user
- [ ] "Upgrade →" link from modal navigates to `/subscription`
- [ ] `npx prisma migrate dev` applies cleanly
- [ ] `npm run build` succeeds
- [ ] Existing users (no Subscription row) still load and show as Free

## Open questions

None — all decisions captured above.
