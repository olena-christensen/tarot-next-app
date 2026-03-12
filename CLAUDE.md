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
