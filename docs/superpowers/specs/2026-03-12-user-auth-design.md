# User Authentication Design

**Date:** 2026-03-12
**Status:** Approved
**Branch:** `subscribing`

## Overview

Add user registration and authentication to the tarot app, wiring up NextAuth v4 with Prisma/Vercel Postgres. Users can sign up and log in via email/password or Google OAuth. No payment or subscription logic — just getting users into the database.

## Dependencies

**New packages:**
- `@prisma/client` — DB client
- `@auth/prisma-adapter` — links NextAuth to Prisma
- `bcryptjs` + `@types/bcryptjs` — password hashing (pure JS, no native build issues)

**Existing (already in package.json):**
- `next-auth` v4.24.7
- `dotenv`

**Database:**
- Existing Prisma schema already has User, Account, Session, VerificationToken, Reading models — no schema changes needed
- Requires `npx prisma generate` and `npx prisma db push`

## Auth Configuration

### `src/lib/auth.ts`

Central NextAuth config:
- `PrismaAdapter` for automatic user/account/session persistence
- `GoogleProvider` — uses `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env vars
- `CredentialsProvider` — takes email + password, looks up user in DB, verifies with bcrypt
- JWT session strategy (required when using CredentialsProvider)
- Callbacks to include `user.id` in the JWT token and session object

### `src/app/api/auth/[...nextauth]/route.ts`

Thin route handler that exports GET/POST from the auth config.

### `src/app/api/auth/register/route.ts`

Registration endpoint:
- Accepts `{ name, email, password }`
- Validates input (email format, password length)
- Checks for existing user with same email
- Hashes password with bcrypt
- Creates user in DB
- Returns success (client then calls `signIn("credentials")` automatically)

## Environment Variables

**New (required):**
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console

**Existing (already configured):**
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`

## UI Components

### `src/components/LoginForm.tsx` (rework existing)

- Toggle between **Sign In** and **Sign Up** modes via a text link
- Sign Up mode: name, email, password fields → calls `/api/auth/register` then auto-signs in
- Sign In mode: email, password fields → calls `signIn("credentials")`
- "Sign in with Google" button in both modes → calls `signIn("google")`
- Error/success feedback inline (e.g. "Email already registered", "Invalid credentials")
- Keeps existing mystical dark/gold styling

### Session awareness

- Wrap the app with NextAuth's `SessionProvider` in a client component
- Login section: when session exists, show "Welcome, [name]" + Sign Out button instead of form

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
SessionProvider wraps app
  → useSession() in Login component
  → If session: show "Welcome, [name]" + Sign Out
  → If no session: show LoginForm
```

## Out of Scope

- Payment / subscription tiers
- Reading limits or usage tracking
- Header user avatar or profile page
- Email verification flow
- Password reset flow
