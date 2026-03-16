# Reusable Modal & User Profile Popup

## Summary

Extract the existing LoginModal into a generic reusable Modal component. Use it to add a user profile popup triggered by clicking the username in the header. Add `createdAt` to the User model.

## Components

### Modal (new — replaces LoginModal)

Generic wrapper component with the same mystical styling as the current LoginModal.

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `title: string`
- `children: React.ReactNode`

**Behavior:** Overlay click closes. Body scroll lock when open. Skull close button. Blur backdrop. Stop propagation on content div.

**File:** `src/components/Modal.tsx`
**SCSS:** Rename `_login-modal.scss` to `_modal.scss`, update class names from `login-modal` to `modal`. Update the import in `style.scss` from `@import "blocks/_login-modal"` to `@import "blocks/_modal"`. Add `@import "blocks/_user-profile"` to `style.scss`.

LoginModal.tsx is deleted. All existing login modal usage switches to `<Modal title="Step Through the Veil"><LoginForm /></Modal>`.

### UserProfile (new)

Displays current user's profile data inside the Modal.

**Fields displayed:**
- Name (fallback: "Mystic One")
- Email
- Member since (formatted createdAt, from session)
- Sign out button ("Slip Into the Shadows")

**File:** `src/components/UserProfile.tsx`
**SCSS:** `src/assets/scss/blocks/_user-profile.scss`

### MainMenu changes

- "Welcome, {name}" becomes clickable — calls `onOpenProfile()`
- Sign out button removed from menu (moves into profile popup)
- Receives new prop `onOpenProfile: () => void`
- Still receives `onOpenLogin` for unauthenticated state ("Reveal Yourself" button)

### Header changes

- Passes `onOpenProfile` through to MainMenu (alongside existing `onOpenLogin`)

### OfferBlock — no changes

OfferBlock already receives `onOpenLogin` and that stays the same. The "Join the Circle of the Chosen" button continues to open the login modal.

### page.tsx changes

- New state: `isProfileOpen`
- Renders two Modals:
  - `<Modal title="Step Through the Veil" ...><LoginForm /></Modal>`
  - `<Modal title="Your Mystic Profile" ...><UserProfile /></Modal>`
- Passes `onOpenProfile` down through Header to MainMenu

## Session — add createdAt to JWT/session

Instead of a separate API route, add `createdAt` to the JWT token and session in `src/lib/auth.ts`:
- In the `authorize` callback: include `createdAt` in the return object (add it to the db query result)
- In the `jwt` callback: when `user` is present (login), store `user.createdAt` in `token.createdAt`
- In the `session` callback: copy `token.createdAt` to `session.user.createdAt`
- Update the NextAuth type declarations to include `createdAt` on the session user
- For Google OAuth: the PrismaAdapter returns the full User record which includes `createdAt`, so it flows through the same jwt callback

This avoids a separate API call — UserProfile reads `createdAt` directly from `useSession()`.

Display format: "Member since March 2026" (month + year).

## Database

Add `createdAt DateTime @default(now())` to the User model in `src/generated/prisma/schema.prisma`. Run migration.

## TODO (future)

Add user ranking tiers based on time spent in the app (e.g., Disciple, Initiate, Witcher, etc.).
