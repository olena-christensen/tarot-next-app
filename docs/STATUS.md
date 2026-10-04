# The Veil — Status & Roadmap

**Last updated:** 2026-10-04 · App scope only.

Markers: 💻 code · 🎨 interface (mockup before any change) · 📋 no code · 📣 growth.

Every open item below was checked against the code on 2026-10-04. Each one says what is wrong, why it matters (👥 visitors · 💶 money · 🔁 keeps users) and how long it takes. If an item can't say that, it doesn't belong here.

<details open>
<summary><b>🟢 Do next — in this order</b></summary>

1. **Check the welcome window on the live site** · 📋 · 5 min
   Sign up once with a Google account that has never used The Veil. You should land on the profile with the "Seal the Pact" window, and it must not close until both boxes are ticked.
   Why 🔁: if it doesn't show, new Google users never accept the terms or confirm they're 18+.

2. **Show "readings left today" on the main page** · 🎨 mockup first · ~1 hour
   Signed-in Seekers get 3 readings a day, but nothing on the screen says so. The first they learn of the limit is the wall after reading 3.
   Why 💶: a visible "1 reading left" is the moment a Seeker thinks about moonstones. Today the paywall just appears with no warning.

3. **Add Pinterest to the share window** · 🎨 mockup first · ~30 min
   Shared readings offer Facebook, Telegram, WhatsApp and the phone's own share menu. There is no Pinterest, the one channel we are growing.
   Why 👥: every reading a visitor pins is a free pin pointing back to theveil.app.

4. **Brew the Potion: moonstone reward and menu link** · 🎨 mockup first for the link · ~2 hours
   The game is live at /game but nobody can find it and finishing it gives nothing yet.
   Why 🔁💶: a daily moonstone for finishing pulls players into readings, which is where moonstones are spent.

5. **Pinterest** · 📣 · 10 min a day
   Post the next pins from `docs/pinterest-pin-log.md` (you are at pin 10). Monday 12 October, 10:00: send a screenshot of https://analytics.pinterest.com so we can decide Batch 2.
   Why 👥: this is the only visitor source we have.

</details>

---

<details>
<summary><b>⏳ Only when something happens</b></summary>

- **When a customer from the European Union pays:** register for European Union sales tax through its One-Stop Shop (one registration that covers every European Union country).
- **When ads are approved:** hide ads from paying subscribers, make the cookie banner block ads until consent, and keep ad slots out of the reading window and the intro animation.
- **When Pinterest brings steady visitors:** resubmit AdSense at https://www.google.com/adsense/new/u/0/pub-9839198217200431/home. It was rejected on 2026-09-25 with no reason given, most likely because the site is new and has almost no visitors.
- **When there are paying monthly subscribers:** fix the daily card email landing in Gmail's Promotions tab. Two fixes have already been tried and failed, see `docs/features/daily-card-email.md` section 2a.
- **When daily-card subscribers reach 40:** move email to a bulk sending service.
- **When you have time to read Russian, Ukrainian or Turkish:** the proofread sheets in `translation-review/` are empty, so nobody has reviewed these languages yet. You can fill the Russian and Ukrainian ones yourself. Turkish needs a native speaker. The sheets predate moonstones, so tell me before starting and I'll regenerate them.

</details>

---

<details>
<summary><b>💡 Ideas (not tasks)</b></summary>

- Login modal loader themed as an entrance to hell.
- Card flip animation highlighting cards one by one.
- Background sound during the loading animation.
- Footer animation for highlighted items.
- Moonstones paying for more than readings: decks, rituals, a shop.

</details>

---

<details open>
<summary><b>✅ Done</b></summary>

### 2026-10

- 2026-10-05 · Built "Brew the Potion", a hidden-object game at /game: 7 ingredients, 16 hiding spots, a new recipe every round, pinch-to-zoom on phones, sounds and cauldron effects, in all 5 languages. Not in the menu yet; no moonstone reward yet. `docs/hidden-object-game.md`
- 2026-10-04 · The full-screen reading window has a quiet "Back to the Sanctum" link under the title while the cards are turned; before, the only way out was to flip all three and wait.
- 2026-10-04 · Moonstone balance chip in the header beside the avatar; opens the price list and refreshes after a purchase or a reading. `src/components/HeaderMoonstones.tsx`
- 2026-10-01 · New Google sign-ups land on the profile and must accept terms + 18+ in a welcome window ("Seal the Pact"). `src/components/WelcomeConsent.tsx`
- 2026-10-01 · Google sign-in now links onto an existing password account (verified emails only) instead of failing silently.
- 2026-10-01 · Checkout opens monobank in a new tab; The Veil's tab waits and confirms by itself — no dead end after paying in the monobank app.
- 2026-10-01 · Moonstones as one compact row under the plans; Seeker card names the default deck and diviner.
- 2026-10-01 · Verified a live 3-moonstone purchase on production.
- 2026-10-01 · Renamed the Pinterest username to match the site.
- 2026-10-01 · Replaced the €1 Offering with Moonstones — packs of 3/€3, 10/€8, 25/€18 in their own section under the plans; balance on the profile for every tier. `src/lib/moonstones.ts`
- 2026-10-01 · Added Vercel Web Analytics (no cookies) to count visitors by source; upgraded Vercel to Node.js 24.
- 2026-10-01 · Made Pinterest Batch 1 — 21 pins with pictures, titles, descriptions and links. `docs/pinterest-pin-log.md`
- 2026-10-01 · Posted the first 6 pins, one on every board.

### 2026-09

- 2026-09-25 · Picked Pinterest as the one growth channel; created The Veil business account, claimed theveil.app, set up 6 boards.
- 2026-09-25 · Added the Pinterest verification tag to `src/app/layout.tsx`.
- 2026-09-09 · Applied the Norwegian proofread — 540 accepted rewrites across 11 message files, including the daily-card and reminder email copy.

### 2026-08

- 2026-08-08 · Moved functions to Frankfurt — they ran in Washington, the database is in Frankfurt.
- 2026-08-08 · Retried the first query of every cron job so a sleeping database costs 3 seconds, not a run.
- 2026-08-08 · Throttled stale-job alerts to once a day instead of once an hour.

- 2026-08-07 · Fixed fiscal receipts — charge in hryvnia, price in euro. `docs/features/currency-and-fiscal-receipts.md`
- 2026-08-07 · Verified a live €1 purchase issues a registered tax receipt.
- 2026-08-07 · Confirmed tarot is allowed on AdSense, created the account, verified ownership.
- 2026-08-07 · Published 78 public card-meaning pages. `docs/features/card-meanings.md`
- 2026-08-06 · Made a crashing cron job report itself instead of failing silently. `docs/features/monitoring.md`
- 2026-08-06 · Added a health endpoint that runs a real query, and pointed the monitor at it.
- 2026-08-06 · Bounded the reconcile sweep so a slow bank cannot kill it before its heartbeat.
- 2026-08-05 · Resolved the terms contradiction — courts kept, arbitration deleted.
- 2026-08-05 · Switched the firewall from logging to blocking.
- 2026-08-05 · Added an external uptime monitor.
- 2026-08-04 · Audited every advertised plan claim against the code, and fixed the yearly saving.
- 2026-08-04 · Closed the platform-gap audit — rate limits, error pages, alerts, heartbeats, data export.
- 2026-08-04 · Fixed the cron that mailed the first 200 people and silently dropped the rest.
- 2026-08-04 · Localized the register, profile and three payment emails.
- 2026-08-04 · Rebuilt the profile page and fixed the truncated header greeting.
- 2026-08-04 · Converted the last nine raw media queries to the breakpoint mixin.
- 2026-08-02 · Built reading history — save, list, rename, delete, favourite, note, print.
- 2026-08-02 · Built shareable readings with generated preview images.
- 2026-08-02 · Built password reset and deleted-user eviction.
- 2026-08-02 · Widened the reconcile window to 90 days and made abandoned checkouts terminal.
- 2026-08-02 · Moved the premium-reader check to the server.
- 2026-08-01 · Shipped avatar upload.

### Before August

- 2026-07-14 · Added the reconciliation sweep for payments whose webhook never arrived.
- 2026-07-14 · Closed every translation gap across five locales.
- 2026-07-13 · Verified the credit and tier loop end to end on production.
- 2026-07-02 · Verified renewal charging and dunning end to end on production.
- 2026-06-30 · Verified card tokenization on production.
- 2026-07-13 · Rebuilt the reader and deck screens for mobile.
- Pre-June · Published terms, privacy, cookie and refund pages, and wired the contact form.
- Pre-June · Set up monobank acquiring. `docs/features/mono-payments.md`

</details>

---

<details>
<summary><b>📇 Key references</b></summary>

| Item | Value |
|---|---|
| Product | The Veil — theveil.app |
| Legal names | Olena Christensen, Individual Entrepreneur · trade name Nothing Weird |
| Payments | Plata by mono (JSC Universal Bank) — charged in hryvnia, priced in euro |
| Plans | Seeker (free) · Monthly €5 · Yearly €39 · Moonstones 3/€3, 10/€8, 25/€18 |
| Contact | `/contact` → privacy@ / legal@ / billing@ / support@ `nothingweird.agency` |
| Hosting | Vercel Pro · uploads Vercel Blob |
| Database | Neon Postgres, Free plan — 100 compute-unit-hours per month |
| Monitoring | `theveil.app` every 5 min · `/api/health` every 30 min |
| AdSense | `pub-9839198217200431`, verified by `public/ads.txt` |
| AdSense — account (Resubmit screen while unapproved) | https://www.google.com/adsense/new/u/0/pub-9839198217200431/home |
| AdSense — Program Policies | https://support.google.com/adsense/answer/48182 |
| Search Console | https://search.google.com/search-console |
| Pinterest — account | https://www.pinterest.com/founder0176/ |
| Pinterest — create a pin | https://www.pinterest.com/pin-creation-tool/ |
| Visitors | Vercel → theveil project → Analytics tab |
| Pinterest — statistics | https://analytics.pinterest.com |
| Pinterest — pin log | `docs/pinterest-pin-log.md` · https://claude.ai/code/artifact/a0cc822b-a9e8-4e2b-a296-8c18abc873f1 |

</details>
