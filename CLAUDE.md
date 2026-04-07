# Project: Tarot Next App

## Infrastructure

- **Hosting:** Vercel (paid plan)
- **Database:** PostgreSQL via Prisma (Vercel Postgres / Prisma Data Platform)
- **Prisma version:** v6 — DO NOT UPGRADE
- **Auth:** NextAuth v4 with Prisma adapter
- **Framework:** Next.js 14, App Router, React 18, TypeScript
- **Styling:** SCSS (`src/assets/scss/`)

## Rules

### Before upgrading ANY dependency:
1. State clearly what version is currently installed and what version you want to install
2. List every breaking change between those versions
3. Estimate how much work the upgrade will require
4. **ASK FOR PERMISSION before proceeding**
5. If the user says no, do not upgrade

### When installing new packages:
- Pin to the major version that matches existing dependencies (e.g., `prisma@6` not `prisma@latest`)
- Never install `@latest` for infrastructure packages without explicit approval

### General:
- DO NOT revert or undo changes without asking
- Keep it direct — just do the work, don't over-explain
- The database and Vercel setup took significant effort — do not break or replace it
- **NEVER commit without explicit user permission** — always ask before committing, even during plan execution. Subagents must NOT commit.
- **ALWAYS use Opus model** — never use Sonnet, Haiku, or any other model for subagents or any task

## Commands

```bash
npm run dev    # Next dev server (localhost:3000)
npm run build  # Runs `prisma generate` then `next build`
npm run start  # Production server
npm run lint   # next lint
npx prisma migrate dev    # Apply schema changes locally
npx prisma studio         # Inspect DB
```

## Project Structure

```
src/
  app/
    api/        # Route handlers: auth/, user/, ask/
    page.tsx    # Main tarot page
    layout.tsx  # Root layout (wraps Providers)
    privacy/, terms/   # Legal pages
  components/   # AnimatedCard, Tarot, Login, LoginForm, Modal,
                # UserProfile, MainMenu, Header, Footer, etc.
  lib/
    auth.ts     # NextAuth config (Credentials + Google)
    prisma.ts   # Prisma client singleton
  generated/prisma/   # Prisma client output (custom location)
  assets/scss/        # All styles
  tarotReadings.ts    # Static card reading data
  AppProvider.tsx, handleAsk.tsx
```

## Environment Variables

Required (see `.env.example`):
- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Gotchas

- **Prisma schema lives at `src/generated/prisma/schema.prisma`**, not the conventional `prisma/` directory. This is set via the `prisma.schema` field in `package.json`. Don't move it.
- `prisma generate` runs as part of `build` — required for Vercel deploys.
- Prisma client is imported via `src/lib/prisma.ts` singleton — use that, don't instantiate `PrismaClient` elsewhere.
- NextAuth is **v4** (not v5/Auth.js). API routes use the `[...nextauth]/route.ts` pattern.
- The Vercel Postgres product was discontinued; the DB is now provisioned through the Vercel Marketplace (Neon). Treat it as plain Postgres via `DATABASE_URL`.
