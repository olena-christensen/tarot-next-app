# Subscription Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/subscription` pricing page (Layout B — Hero split), a `Subscription` Prisma model + helper, and a "Current plan" indicator in the user profile modal. No payment integration.

**Architecture:** Static plan catalog in `src/lib/plans.ts`. New `Subscription` table tracks per-user plan, defaulting to FREE when no row exists. Server component renders the pricing page; existing `UserProfile` modal gains a small server-fetched plan indicator. Disabled CTAs ("Coming soon") on all upgrade buttons.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Prisma 6 (Postgres), NextAuth v4, SCSS.

**Notes for the engineer:**
- Read `CLAUDE.md` at repo root before starting — it has the project rules (Prisma v6 lock, schema lives at `src/generated/prisma/schema.prisma`, etc.).
- This project has **no test suite**. Verification is manual via the checklists in each task.
- The user handles all git commits — finish each task and tell the user it's ready to commit, do not run `git commit` yourself.

---

## File Structure

| File | Action | Purpose |
| ---- | ------ | ------- |
| `src/generated/prisma/schema.prisma` | modify | Add `PlanId` enum, `Subscription` model, `subscription` relation on `User` |
| `src/lib/plans.ts` | create | Static plan catalog (typed) |
| `src/lib/subscription.ts` | create | `getUserPlan(userId)` helper |
| `src/components/SubscriptionPlans.tsx` | create | Pricing-page component (Layout B) |
| `src/app/subscription/page.tsx` | create | Server page rendering `<SubscriptionPlans/>` |
| `src/assets/scss/_subscription.scss` | create | Styles for pricing page |
| `src/assets/scss/main.scss` (or wherever partials are imported) | modify | Import `_subscription.scss` |
| `src/components/UserProfile.tsx` | modify | Show "Current plan: <name>" + Upgrade link |
| `src/app/api/user/plan/route.ts` | create | GET endpoint returning current user's plan id |
| `src/components/MainMenu.tsx` | modify | Add "Pricing" link to `/subscription` |

---

## Task 1: Add `Subscription` model to Prisma schema

**Files:**
- Modify: `src/generated/prisma/schema.prisma`

- [ ] **Step 1: Add the enum and model**

Append to `src/generated/prisma/schema.prisma`:

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
```

- [ ] **Step 2: Add the relation on `User`**

In the `User` model in the same file, add this line (alongside `accounts`, `sessions`, `readings`):

```prisma
  subscription Subscription?
```

- [ ] **Step 3: Create and apply the migration**

Run:

```bash
npx prisma migrate dev --name add_subscription_model
```

Expected: Migration is created in `prisma/migrations/`, applied to the dev DB, and the Prisma client is regenerated.

- [ ] **Step 4: Verify generated client has the new types**

Run:

```bash
npx tsc --noEmit
```

Expected: No errors. (If the engineer added types referencing `Subscription` later, this guards against typos.)

- [ ] **Step 5: Notify user — ready to commit**

Tell the user: "Task 1 done — schema + migration applied. Ready to commit."

---

## Task 2: Create static plan catalog

**Files:**
- Create: `src/lib/plans.ts`

- [ ] **Step 1: Write the catalog**

Create `src/lib/plans.ts` with:

```ts
export type PlanId = "FREE" | "SINGLE" | "MONTHLY" | "YEARLY";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  interval: "one-time" | "month" | "year" | null;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceLabel: "$0",
    interval: null,
    features: ["3 readings per day", "Resets at midnight"],
  },
  SINGLE: {
    id: "SINGLE",
    name: "Single reading",
    priceLabel: "$1",
    interval: "one-time",
    features: ["One extra reading", "No subscription"],
  },
  MONTHLY: {
    id: "MONTHLY",
    name: "Monthly",
    priceLabel: "$10",
    interval: "month",
    features: [
      "Unlimited readings",
      "Reading history",
      "Choose your deck",
      "Choose your diviner",
      "Long-form interpretations",
      "Daily card email",
      "Export readings as PDF",
      "Favorites & personal notes",
      "Reminder notifications",
      "Ad-free",
    ],
  },
  YEARLY: {
    id: "YEARLY",
    name: "Yearly",
    priceLabel: "$50",
    interval: "year",
    features: [
      "Everything in Monthly",
      "Save 58% vs monthly",
      "Exclusive seasonal decks",
      "Early access to new diviners & decks",
    ],
    highlight: true,
  },
};

export const PLAN_ORDER: PlanId[] = ["FREE", "SINGLE", "MONTHLY", "YEARLY"];
```

- [ ] **Step 2: Type-check**

Run:

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Notify user — ready to commit**

---

## Task 3: Create `getUserPlan` helper

**Files:**
- Create: `src/lib/subscription.ts`

- [ ] **Step 1: Write the helper**

Create `src/lib/subscription.ts`:

```ts
import prisma from "./prisma";
import type { PlanId } from "./plans";

export async function getUserPlan(userId: string): Promise<PlanId> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { planId: true },
    });
    return (sub?.planId as PlanId | undefined) ?? "FREE";
  } catch (err) {
    console.error("[getUserPlan] failed, defaulting to FREE", err);
    return "FREE";
  }
}
```

**Note for engineer:** The existing Prisma client singleton is at `src/lib/prisma.ts`. Confirm the default export matches before importing — if the existing file uses a named export, switch to `import { prisma } from "./prisma";`.

- [ ] **Step 2: Type-check**

Run:

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Notify user — ready to commit**

---

## Task 4: Create the API route `/api/user/plan`

**Files:**
- Create: `src/app/api/user/plan/route.ts`

This route lets the client `UserProfile` modal fetch the current plan, matching how it already fetches `password-status`.

- [ ] **Step 1: Write the route**

Create `src/app/api/user/plan/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPlan } from "@/lib/subscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planId = await getUserPlan(session.user.id);
  return NextResponse.json({ planId });
}
```

**Note for engineer:** Verify that `authOptions` is exported from `@/lib/auth` and that `session.user.id` exists in the project's NextAuth callback config. If `id` is not on `session.user`, fall back to looking up the user by email.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Manually test the endpoint**

Start dev server: `npm run dev`. Sign in. Visit `http://localhost:3000/api/user/plan` in the browser.

Expected: `{"planId":"FREE"}`.

- [ ] **Step 4: Notify user — ready to commit**

---

## Task 5: Build the `SubscriptionPlans` component

**Files:**
- Create: `src/components/SubscriptionPlans.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/SubscriptionPlans.tsx`:

```tsx
import { PLANS } from "@/lib/plans";

export const SubscriptionPlans = () => {
  const free = PLANS.FREE;
  const single = PLANS.SINGLE;
  const monthly = PLANS.MONTHLY;
  const yearly = PLANS.YEARLY;

  return (
    <section className="subscription">
      <header className="subscription__header">
        <h1 className="subscription__title">Choose your path</h1>
        <p className="subscription__subtitle">
          Unlock unlimited readings, your favorite decks, and the diviners who
          speak to you.
        </p>
      </header>

      <div className="subscription__single">
        <div>
          <div className="subscription__single-name">{single.name}</div>
          <div className="subscription__single-desc">One extra reading</div>
        </div>
        <div className="subscription__single-price">{single.priceLabel}</div>
        <button
          type="button"
          className="subscription__cta subscription__cta--small"
          disabled
          title="Payments launching soon"
        >
          Coming soon
        </button>
      </div>

      <div className="subscription__tiers">
        <article className="subscription__tier">
          <h2 className="subscription__tier-name">{monthly.name}</h2>
          <div className="subscription__tier-price">
            {monthly.priceLabel}
            <span className="subscription__tier-interval">/mo</span>
          </div>
          <ul className="subscription__features">
            {monthly.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button
            type="button"
            className="subscription__cta"
            disabled
            title="Payments launching soon"
          >
            Coming soon
          </button>
        </article>

        <article className="subscription__tier subscription__tier--highlight">
          <span className="subscription__badge">Save 58%</span>
          <h2 className="subscription__tier-name">{yearly.name}</h2>
          <div className="subscription__tier-price">
            {yearly.priceLabel}
            <span className="subscription__tier-interval">/yr</span>
          </div>
          <ul className="subscription__features">
            {yearly.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button
            type="button"
            className="subscription__cta"
            disabled
            title="Payments launching soon"
          >
            Coming soon
          </button>
        </article>
      </div>

      <p className="subscription__free-note">
        Free: {free.features[0]} — no signup needed
      </p>
    </section>
  );
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Notify user — ready to commit**

---

## Task 6: Style the pricing page

**Files:**
- Create: `src/assets/scss/_subscription.scss`
- Modify: the main scss entry that imports partials (find via `grep -rn "@use\|@import" src/assets/scss | head`)

- [ ] **Step 1: Find the scss entry point**

Run:

```bash
grep -rn "subscription\|@use\|@import" src/assets/scss
```

Identify the file that imports other partials (e.g., `main.scss`, `_index.scss`, or wherever the project keeps the partial registry). The pattern this project uses for partial imports must be matched exactly.

- [ ] **Step 2: Write the partial**

Create `src/assets/scss/_subscription.scss`:

```scss
.subscription {
  max-width: 960px;
  margin: 0 auto;
  padding: 80px 24px 120px;
  color: #f4ecff;

  &__header {
    text-align: center;
    margin-bottom: 48px;
  }

  &__title {
    font-size: 2.5rem;
    margin: 0 0 12px;
    letter-spacing: 0.02em;
  }

  &__subtitle {
    font-size: 1.05rem;
    color: #c5b8de;
    max-width: 520px;
    margin: 0 auto;
  }

  &__single {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: rgba(42, 37, 64, 0.6);
    border: 1px solid rgba(120, 100, 170, 0.4);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 32px;
  }

  &__single-name {
    font-weight: 600;
    color: #e8d9ff;
  }

  &__single-desc {
    font-size: 0.85rem;
    color: #a99fc4;
  }

  &__single-price {
    font-size: 1.4rem;
    font-weight: 600;
    color: #fff;
  }

  &__tiers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }

  &__tier {
    position: relative;
    background: rgba(42, 37, 64, 0.7);
    border: 1px solid rgba(120, 100, 170, 0.4);
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;

    &--highlight {
      border-color: #c9a8ff;
      box-shadow: 0 0 32px rgba(201, 168, 255, 0.2);
    }
  }

  &__badge {
    position: absolute;
    top: -12px;
    right: 20px;
    background: #c9a8ff;
    color: #1a1530;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 4px 12px;
    border-radius: 12px;
  }

  &__tier-name {
    font-size: 1.4rem;
    margin: 0 0 8px;
    color: #fff;
  }

  &__tier-price {
    font-size: 2.2rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 20px;
  }

  &__tier-interval {
    font-size: 0.95rem;
    font-weight: 400;
    color: #a99fc4;
    margin-left: 4px;
  }

  &__features {
    list-style: none;
    padding: 0;
    margin: 0 0 28px;
    flex: 1;

    li {
      padding: 6px 0 6px 22px;
      position: relative;
      color: #d6c9ee;
      font-size: 0.95rem;

      &::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: #c9a8ff;
      }
    }
  }

  &__cta {
    background: #c9a8ff;
    color: #1a1530;
    border: none;
    border-radius: 10px;
    padding: 14px 20px;
    font-size: 1rem;
    font-weight: 600;
    cursor: not-allowed;
    opacity: 0.6;
    transition: opacity 0.2s;

    &--small {
      padding: 10px 16px;
      font-size: 0.9rem;
    }
  }

  &__free-note {
    text-align: center;
    color: #8a80a4;
    font-size: 0.9rem;
    margin: 0;
  }

  @media (max-width: 720px) {
    padding: 48px 16px 80px;

    &__title {
      font-size: 1.9rem;
    }

    &__tiers {
      grid-template-columns: 1fr;
    }

    &__single {
      flex-wrap: wrap;
    }
  }
}
```

- [ ] **Step 3: Import the partial**

Add the import to whichever scss entry file imports other partials, following the project's existing pattern (e.g., `@use "subscription";` or `@import "./subscription";`).

- [ ] **Step 4: Notify user — ready to commit**

---

## Task 7: Create the `/subscription` page

**Files:**
- Create: `src/app/subscription/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/subscription/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";

export const metadata: Metadata = {
  title: "Pricing — Tarot",
  description: "Choose a plan and unlock unlimited readings.",
};

export default function SubscriptionPage() {
  return <SubscriptionPlans />;
}
```

- [ ] **Step 2: Verify it renders**

Run `npm run dev` and visit `http://localhost:3000/subscription`.

Expected:
- Title "Choose your path" visible
- Single-reading row visible at $1
- Two tiers: Monthly $10/mo and Yearly $50/yr (Yearly highlighted with "Save 58%" badge)
- All buttons disabled, hover shows "Payments launching soon"
- Free footnote visible at the bottom
- Resize to mobile width (~400px) — Monthly/Yearly stack vertically

- [ ] **Step 3: Notify user — ready to commit**

---

## Task 8: Add "Pricing" link to MainMenu

**Files:**
- Modify: `src/components/MainMenu.tsx`

- [ ] **Step 1: Read the file and find the existing link list**

```bash
cat src/components/MainMenu.tsx
```

Identify how the existing menu items are structured (Link components, an array of items, etc.).

- [ ] **Step 2: Add the Pricing link**

Following the same pattern as existing menu items, add an entry pointing to `/subscription` with the label "Pricing". Place it in a logical position (e.g., before legal links).

- [ ] **Step 3: Verify in browser**

`npm run dev`, open the menu, click "Pricing", confirm it navigates to `/subscription`.

- [ ] **Step 4: Notify user — ready to commit**

---

## Task 9: Show "Current plan" in UserProfile modal

**Files:**
- Modify: `src/components/UserProfile.tsx`

- [ ] **Step 1: Add state and fetch logic**

In `UserProfile.tsx`, near the existing `useState` calls (around the `hasPassword` block), add:

```tsx
const [planId, setPlanId] = useState<string | null>(null);
```

In the existing `useEffect` block that calls `password-status` (or in a new `useEffect`), add a fetch for the plan:

```tsx
useEffect(() => {
  async function loadPlan() {
    try {
      const res = await fetch("/api/user/plan");
      if (res.ok) {
        const data = await res.json();
        setPlanId(data.planId);
      }
    } catch {
      // silent — UI will fall back to "—"
    }
  }
  loadPlan();
}, []);
```

- [ ] **Step 2: Import the plan catalog**

At the top of `UserProfile.tsx`:

```tsx
import { PLANS } from "@/lib/plans";
import Link from "next/link";
```

(Skip the `Link` import if it's already imported.)

- [ ] **Step 3: Render the plan row in the JSX**

Find where existing profile rows are rendered (e.g., name, member-since, password). Add a new row in the same style:

```tsx
<div className="user-profile__row">
  <span className="user-profile__label">Current plan</span>
  <span className="user-profile__value">
    {planId ? PLANS[planId as keyof typeof PLANS]?.name ?? "Free" : "—"}
  </span>
  <Link
    href="/subscription"
    className="user-profile__link"
    onClick={() => onClose?.()}
  >
    Upgrade →
  </Link>
</div>
```

**Note for engineer:** Match the actual class names and JSX structure used by the surrounding rows in `UserProfile.tsx`. The class names above are placeholders to be aligned with whatever convention the file already uses (e.g., the existing component might use `row`, `field`, or BEM names — copy what's there).

- [ ] **Step 4: Type-check and verify in browser**

```bash
npx tsc --noEmit
```

Then `npm run dev`, sign in, open the user profile modal:

Expected:
- "Current plan: Free" visible
- "Upgrade →" link navigates to `/subscription` and closes the modal

- [ ] **Step 5: Notify user — ready to commit**

---

## Task 10: Final manual verification pass

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript or Prisma errors.

- [ ] **Step 2: Walk through the full checklist**

With `npm run dev` running and signed in as a test user:

- [ ] `/subscription` renders Layout B correctly on desktop
- [ ] Mobile width (≤720px) stacks Monthly/Yearly vertically
- [ ] All upgrade CTAs are disabled, tooltip "Payments launching soon" appears on hover
- [ ] `MainMenu` has a "Pricing" link that navigates to `/subscription`
- [ ] `UserProfile` modal shows "Current plan: Free"
- [ ] "Upgrade →" link from modal navigates to `/subscription` and closes the modal
- [ ] Existing pages (home, terms, privacy, login) still render fine
- [ ] Existing user with no `Subscription` row still loads as Free (no crash)

- [ ] **Step 3: Notify user — implementation complete**

Tell the user: "All tasks done. Ready for final review and commit."

---

## Spec Coverage Self-Check

| Spec section | Covered by |
| ------------ | ---------- |
| Plans table & terminology | Task 2 |
| `/subscription` route | Task 7 |
| Layout B — Hero split visual | Tasks 5 + 6 |
| Disabled CTAs with tooltip | Task 5 |
| `Subscription` Prisma model | Task 1 |
| `getUserPlan` helper | Task 3 |
| `UserProfile` "Current plan" + Upgrade link | Tasks 4 + 9 |
| `MainMenu` "Pricing" link | Task 8 |
| Mobile responsive | Task 6 (media query) + Task 10 (verify) |
| Existing users default to Free | Task 3 (helper) + Task 10 (verify) |
| Manual verification (no test suite) | Task 10 |

All spec items mapped. No placeholders. Type names consistent across tasks (`PlanId`, `PLANS`, `getUserPlan`, `Subscription`).
