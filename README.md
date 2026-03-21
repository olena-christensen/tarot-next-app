# Tarot — Magic Light

An interactive tarot card reading web app with a richly themed mystical UI. Users can shuffle the deck, draw cards in a 3-card spread, browse the full card gallery, and create an account to save their readings.

[Live Demo](https://tarot-next-app.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | SCSS |
| Database | PostgreSQL (Neon via Vercel) |
| ORM | Prisma v6 |
| Auth | NextAuth v4 (Google OAuth + Credentials) |
| 3D | Three.js |
| Deployment | Vercel |

## Features

- **Deck Shuffle** — animated card shuffling interaction
- **3-Card Spread** — draw and reveal tarot cards with meanings
- **Card Gallery** — browse the full deck with detailed card illustrations
- **Authentication** — Google OAuth and email/password login
- **User Profile** — editable name, set/change password
- **Saved Readings** — logged-in users can save and revisit past readings
- **Responsive Design** — optimized for desktop and mobile
- **Themed UI** — custom dark/gold mystical aesthetic with illustrated card art

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
git clone https://github.com/Menolas/tarot-next-app.git
cd tarot-next-app
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Database Setup

```bash
npx prisma db push
npx prisma generate
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
tarot-next-app/
├── public/              # Static assets (card images, fonts, etc.)
├── src/
│   ├── app/             # Next.js App Router pages and API routes
│   ├── assets/scss/     # SCSS stylesheets
│   ├── components/      # React components
│   ├── generated/prisma # Prisma client and schema
│   └── lib/             # Auth config, Prisma client, utilities
├── next.config.mjs
├── tsconfig.json
└── package.json
```
