# The Veil — Status & Roadmap

**Last updated:** 2026-08-07 · App scope only.

One line per item. Markers: 💻 code · 🎨 interface · 📋 no-code · 📣 growth.
Detail lives in `docs/features/` and `CLAUDE.md`, never here.

<details open>
<summary><b>🟢 Next — showing ads on The Veil</b></summary>

- [ ] 📣 Estimate ad revenue at current traffic against the design cost.
- [ ] 💻 Place ad slots outside the card modal and the intro animation.
- [ ] 📋 Answer Google's review when it arrives — `docs/features/adsense.md`.

</details>

---

<details open>
<summary><b>🔴 Must-have once triggered</b></summary>

- [ ] 📋 Register for European Union sales tax when the first European customer pays.
- [ ] 💻 Hide ads from paying subscribers the day ads go live.
- [ ] 💻 Make the cookie banner block ads until consent the day ads go live.
- [ ] 📋 Move email to a bulk sender at 40 daily-card subscribers — `docs/features/email.md`.

</details>

---

<details>
<summary><b>📣 Growth</b></summary>

- [ ] 📣 Pick the one channel to actually work, and ignore the rest.
- [ ] 📣 Measure arrivals, sign-ups and payments — three numbers, not a dashboard.
- [ ] 📣 Add share buttons for Instagram, Pinterest, TikTok and Facebook.
- [ ] 💻 Wire Facebook and Twitter sign-in — the tables already exist.

</details>

---

<details>
<summary><b>🌱 Nice to have</b></summary>

- [ ] 📋 Apply the Russian translation proofread.
- [ ] 📋 Apply the Ukrainian translation proofread.
- [ ] 📋 Apply the Turkish translation proofread.
- [ ] 📋 Apply the Norwegian translation proofread.
- [ ] 📋 Translate the 78 card meanings — `docs/features/card-meanings.md`.
- [ ] 📋 Pay a lawyer to read the terms and privacy pages.
- [ ] 💻 Get the daily card email into Gmail's Primary tab — `docs/features/daily-card-email.md`.
- [ ] 💻 Replace the €1 single reading with buyable crystals — `docs/features/crystals.md`.
- [ ] 🎨 Show readings left today on the main page.
- [ ] 🎨 Move reader selection before the deck appears.
- [ ] 🎨 Add a close button to the full-screen card modal.
- [ ] 🎨 Rename "Revoke and Retry" to "Draw again".
- [ ] 📋 Register a copyright agent with the United States Copyright Office.

</details>

---

<details>
<summary><b>💡 Ideas</b></summary>

- Login modal loader themed as an entrance to hell.
- Card flip animation highlighting cards one by one.
- Background sound during the loading animation.
- Footer animation for highlighted items.

</details>

---

<details open>
<summary><b>✅ Done</b></summary>

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
| Plans | FREE · SINGLE €1 · MONTHLY €5 · YEARLY €39 |
| Contact | `/contact` → privacy@ / legal@ / billing@ / support@ `nothingweird.agency` |
| Hosting | Vercel Pro · uploads Vercel Blob |
| Database | Neon Postgres, Free plan — 100 compute-unit-hours per month |
| Monitoring | `theveil.app` every 5 min · `/api/health` every 30 min |
| AdSense | `pub-9839198217200431`, verified by `public/ads.txt` |

</details>
