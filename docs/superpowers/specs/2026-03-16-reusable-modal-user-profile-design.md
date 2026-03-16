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
**SCSS:** Rename `_login-modal.scss` to `_modal.scss`, update class names from `login-modal` to `modal`.

LoginModal.tsx is deleted. All existing login modal usage switches to `<Modal title="Step Through the Veil"><LoginForm /></Modal>`.

### UserProfile (new)

Displays current user's profile data inside the Modal.

**Fields displayed:**
- Name (fallback: "Mystic One")
- Email
- Member since (formatted createdAt)
- Sign out button ("Slip Into the Shadows")

**File:** `src/components/UserProfile.tsx`
**SCSS:** `src/assets/scss/blocks/_user-profile.scss`

### MainMenu changes

- "Welcome, {name}" becomes clickable — calls `onOpenProfile()`
- Sign out button removed from menu (moves into profile popup)
- Receives new prop `onOpenProfile: () => void`

### page.tsx changes

- New state: `isProfileOpen`
- Renders two Modals:
  - `<Modal title="Step Through the Veil" ...><LoginForm /></Modal>`
  - `<Modal title="Your Mystic Profile" ...><UserProfile /></Modal>`
- Passes `onOpenProfile` down through Header to MainMenu

## API

### GET /api/user/profile (new)

Returns `{ name, email, createdAt }` for the authenticated user. Returns 401 if not logged in. Fetches from database since session doesn't include `createdAt`.

**File:** `src/app/api/user/profile/route.ts`

## Database

Add `createdAt DateTime @default(now())` to the User model in `prisma/schema.prisma`. Run migration.

## TODO (future)

Add user ranking tiers based on time spent in the app (e.g., Disciple, Initiate, Witcher, etc.).
