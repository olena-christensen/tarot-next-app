# Reusable Modal & User Profile Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract LoginModal into a generic Modal component, add a UserProfile popup with createdAt, and wire it all into MainMenu/Header/page.tsx.

**Architecture:** Replace LoginModal with a generic `<Modal>` wrapper that takes children. Create a UserProfile component that reads session data (including createdAt). Surface createdAt through NextAuth JWT/session callbacks. Two modal instances in page.tsx — one for login, one for profile.

**Tech Stack:** Next.js 14, React 18, NextAuth v4, Prisma v6, SCSS

**Spec:** `docs/superpowers/specs/2026-03-16-reusable-modal-user-profile-design.md`

---

## Chunk 1: Database & Auth — createdAt on User

### Task 1: Add createdAt to User model & migrate

**Files:**
- Modify: `src/generated/prisma/schema.prisma:39-49`

- [ ] **Step 1: Add createdAt field to User model**

In `src/generated/prisma/schema.prisma`, add to the User model:

```prisma
createdAt     DateTime  @default(now())
```

Add it after the `image` field, before the relations.

- [ ] **Step 2: Run Prisma migration**

```bash
npx prisma migrate dev --name add-user-created-at --schema src/generated/prisma/schema.prisma
```

- [ ] **Step 3: Generate Prisma client**

```bash
npx prisma generate --schema src/generated/prisma/schema.prisma
```

- [ ] **Step 4: Commit**

```bash
git add src/generated/prisma/ prisma/
git commit -m "feat: add createdAt to User model"
```

### Task 2: Surface createdAt through NextAuth session

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/types/next-auth.d.ts`

- [ ] **Step 1: Create NextAuth type declarations**

Create `src/types/next-auth.d.ts`:

```typescript
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    createdAt?: Date;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      createdAt?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    createdAt?: string;
  }
}
```

- [ ] **Step 2: Update authorize callback to include createdAt**

In `src/lib/auth.ts`, update the return object in `authorize`:

```typescript
return {
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image,
  createdAt: user.createdAt,
};
```

- [ ] **Step 3: Update jwt callback to store createdAt**

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.createdAt = user.createdAt
      ? new Date(user.createdAt).toISOString()
      : undefined;
  }
  return token;
},
```

- [ ] **Step 4: Update session callback to expose createdAt**

```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id;
    session.user.createdAt = token.createdAt;
  }
  return session;
},
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts
git commit -m "feat: surface createdAt through NextAuth session"
```

## Chunk 2: Reusable Modal Component

### Task 3: Create generic Modal component

**Files:**
- Create: `src/components/Modal.tsx`
- Delete: `src/components/LoginModal.tsx`
- Rename: `src/assets/scss/blocks/_login-modal.scss` → `src/assets/scss/blocks/_modal.scss`
- Modify: `src/assets/scss/style.scss`

- [ ] **Step 1: Create `src/components/Modal.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import Skull from "../assets/svg/skull.svg";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__content" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>
          <Skull />
        </button>
        <h2 className="title title--secondary modal__title">{title}</h2>
        {children}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Rename SCSS file and update class names**

Rename `src/assets/scss/blocks/_login-modal.scss` to `src/assets/scss/blocks/_modal.scss`.

Update all class names inside from `login-modal` → `modal`:
- `.login-modal` → `.modal`
- `.login-modal__content` → `.modal__content`
- `.login-modal__close` → `.modal__close`
- `.login__title` → `.modal__title`

- [ ] **Step 3: Update style.scss import**

In `src/assets/scss/style.scss`, change:
```scss
@import "blocks/_login-modal";
```
to:
```scss
@import "blocks/_modal";
```

- [ ] **Step 4: Delete LoginModal.tsx**

Remove `src/components/LoginModal.tsx`.

- [ ] **Step 5: Update page.tsx to use Modal**

In `src/app/page.tsx`:
- Replace `import {LoginModal}` with `import {Modal}` from `@/components/Modal`
- Add `import {LoginForm}` from `@/components/LoginForm`
- Replace `<LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />` with:

```tsx
<Modal
  title="Step Through the Veil"
  isOpen={isLoginOpen}
  onClose={() => setIsLoginOpen(false)}
>
  <LoginForm onSuccess={() => setIsLoginOpen(false)} />
</Modal>
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: extract LoginModal into reusable Modal component"
```

## Chunk 3: UserProfile Component & Wiring

### Task 4: Create UserProfile component

**Files:**
- Create: `src/components/UserProfile.tsx`
- Create: `src/assets/scss/blocks/_user-profile.scss`
- Modify: `src/assets/scss/style.scss`

- [ ] **Step 1: Create `src/components/UserProfile.tsx`**

```tsx
"use client";

import { useSession, signOut } from "next-auth/react";

export const UserProfile = () => {
  const { data: session } = useSession();

  const memberSince = session?.user?.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="user-profile">
      <div className="user-profile__field">
        <span className="user-profile__label">Name</span>
        <span className="user-profile__value">
          {session?.user?.name || "Mystic One"}
        </span>
      </div>
      <div className="user-profile__field">
        <span className="user-profile__label">Email</span>
        <span className="user-profile__value">{session?.user?.email}</span>
      </div>
      {memberSince && (
        <div className="user-profile__field">
          <span className="user-profile__label">Member since</span>
          <span className="user-profile__value">{memberSince}</span>
        </div>
      )}
      <button
        className="btn user-profile__btn"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Slip Into the Shadows
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Create `src/assets/scss/blocks/_user-profile.scss`**

```scss
.user-profile {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;

  .user-profile__field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .user-profile__label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: $primary;
    opacity: 0.7;
  }

  .user-profile__value {
    font-size: 1.1rem;
    color: $primary;
  }

  .user-profile__btn {
    margin-top: 1rem;
  }
}
```

- [ ] **Step 3: Add user-profile import to style.scss**

In `src/assets/scss/style.scss`, add after the `_modal` import:

```scss
@import "blocks/_user-profile";
```

- [ ] **Step 4: Commit**

```bash
git add src/components/UserProfile.tsx src/assets/scss/blocks/_user-profile.scss src/assets/scss/style.scss
git commit -m "feat: add UserProfile component"
```

### Task 5: Wire profile modal into MainMenu, Header, and page.tsx

**Files:**
- Modify: `src/components/MainMenu.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update MainMenu — make welcome text clickable, remove sign out button**

Replace `src/components/MainMenu.tsx` authenticated block. Add `onOpenProfile` prop:

```tsx
type MainMenuProps = {
    onOpenLogin: () => void;
    onOpenProfile: () => void;
};

export default function MainMenu({ onOpenLogin, onOpenProfile }: MainMenuProps) {
```

Replace the authenticated `<>...</>` block with:

```tsx
<li className="main-menu__item">
    <button
        className="btn main-menu__link"
        onClick={onOpenProfile}
    >
        Welcome, {session.user?.name || "Mystic One"}
    </button>
</li>
```

(Sign out button removed — it lives in UserProfile now.)

- [ ] **Step 2: Update Header — pass onOpenProfile through**

```tsx
type HeaderProps = {
    onOpenLogin: () => void;
    onOpenProfile: () => void;
};

export const Header = ({onOpenLogin, onOpenProfile}: HeaderProps) => {
    return (
        <header className="main-header container">
            <Logo />
            <MainMenu onOpenLogin={onOpenLogin} onOpenProfile={onOpenProfile} />
        </header>
    );
};
```

- [ ] **Step 3: Update page.tsx — add profile modal state and render**

Add imports:
```tsx
import {UserProfile} from "@/components/UserProfile";
```

Add state:
```tsx
const [isProfileOpen, setIsProfileOpen] = useState(false);
```

Update Header to pass `onOpenProfile`:
```tsx
<Header
  onOpenLogin={() => setIsLoginOpen(true)}
  onOpenProfile={() => setIsProfileOpen(true)}
/>
```

Add profile Modal after the login Modal:
```tsx
<Modal
  title="Your Mystic Profile"
  isOpen={isProfileOpen}
  onClose={() => setIsProfileOpen(false)}
>
  <UserProfile />
</Modal>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/MainMenu.tsx src/components/Header.tsx src/app/page.tsx
git commit -m "feat: add user profile popup with modal"
```
