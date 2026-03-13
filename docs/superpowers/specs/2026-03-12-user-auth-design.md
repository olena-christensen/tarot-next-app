# User Authentication Design

**Date:** 2026-03-12
**Status:** Approved
**Branch:** `subscribing`

## Overview

Add user registration and authentication to the tarot app, wiring up NextAuth v4 with Prisma/Vercel Postgres. Users can sign up and log in via email/password or Google OAuth. No payment or subscription logic — just getting users into the database.

## Dependencies

**New packages to install:**
- `@prisma/client` — DB client
- `@auth/prisma-adapter` — links NextAuth to Prisma
- `bcryptjs` + `@types/bcryptjs` — password hashing (pure JS, no native build issues)
- `prisma` (dev dependency) — Prisma CLI for generate/push

**Existing (already in package.json):**
- `next-auth` v4.24.7

**Database:**
- Existing Prisma schema at `src/generated/prisma/schema.prisma` already has User, Account, Session, VerificationToken, Reading models — no schema changes needed except adding `url = env("DATABASE_URL")` to the datasource block
- Non-standard schema location: use `--schema src/generated/prisma/schema.prisma` flag with Prisma CLI commands, or add `"prisma": { "schema": "src/generated/prisma/schema.prisma" }` to `package.json`
- Requires `npx prisma generate` and `npx prisma db push`

## Auth Configuration

### Create `src/lib/auth.ts`

Central NextAuth config (new file):
- `PrismaAdapter` for automatic user/account/session persistence
- `GoogleProvider` — uses `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env vars
- `CredentialsProvider` — takes email + password, looks up user in DB, verifies with bcrypt
- JWT session strategy (required when using CredentialsProvider)
- Callbacks to include `user.id` in the JWT token and session object

### Create `src/app/api/auth/[...nextauth]/route.ts`

New route handler that exports GET/POST from the auth config.

### Create `src/app/api/auth/register/route.ts`

New registration endpoint:
- Accepts `{ name, email, password }`
- Validates input (email format, password min 8 chars)
- Checks for existing user with same email
- Hashes password with bcrypt (salt rounds: 12)
- Creates user in DB
- Returns success (client then calls `signIn("credentials")` automatically)

## Environment Variables

**New (required):**
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console

**Existing (already in `.env`):**
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`

## UI Components

### Rewrite `src/components/LoginForm.tsx`

The current LoginForm is a presentational-only component with no state or handlers — it needs a near-complete rewrite:
- Toggle between **Sign In** and **Sign Up** modes via a text link
- Sign Up mode: name, email, password fields → calls `/api/auth/register` then auto-signs in
- Sign In mode: email, password fields → calls `signIn("credentials")`
- "Sign in with Google" button in both modes → calls `signIn("google")`
- Error/success feedback inline (e.g. "Email already registered", "Invalid credentials")
- Remove the "Lost your password?" link (password reset is out of scope)
- Keeps existing mystical dark/gold styling

### Session Provider integration

Create `src/components/Providers.tsx` — a client component that wraps both `SessionProvider` (from next-auth) and the existing `AppProvider`. Import this in `page.tsx` to replace the current direct `AppProvider` usage.

### Session awareness in Login section

- `useSession()` in the Login component
- When session exists: show "Welcome, [name]" + Sign Out button instead of the form
- When no session: show LoginForm

## Data Flows

### Registration
```
LoginForm (Sign Up mode)
  → POST /api/auth/register { name, email, password }
  → bcrypt hash → prisma user.create
  → auto signIn("credentials", { email, password })
  → JWT issued → session active
```

### Email/Password Login
```
LoginForm (Sign In mode)
  → signIn("credentials", { email, password })
  → CredentialsProvider: find user, bcrypt.compare
  → JWT issued → session active
```

### Google OAuth Login
```
LoginForm ("Sign in with Google" button)
  → signIn("google")
  → Google OAuth flow → redirect back
  → PrismaAdapter auto-creates User + Account records
  → JWT issued → session active
```

### Logged-in State
```
Providers.tsx wraps app (SessionProvider + AppProvider)
  → useSession() in Login component
  → If session: show "Welcome, [name]" + Sign Out
  → If no session: show LoginForm
```

## Account Linking

If a user registers with email/password and later tries Google OAuth with the same email (or vice versa), NextAuth will reject the second provider by default. This is acceptable for now — the user sees an error and must use their original sign-in method. Multi-provider account linking is out of scope.

## Out of Scope

- Payment / subscription tiers
- Reading limits or usage tracking
- Header user avatar or profile page
- Email verification flow
- Password reset flow
- Rate limiting on registration endpoint
- Multi-provider account linking for same email
