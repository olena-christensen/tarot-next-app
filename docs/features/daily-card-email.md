# Daily Card Email

**Status:** built and scheduled, 2026-08-02.

Makes good on one of the MONTHLY claims in `messages/*/plans.json` ("Daily card email"),
which the code did not back.

**Shape chosen:** one card per day, a short piece of new copy written for that card, and a
link into the app. Not the full three-card reading — the email is a hook, the app is where
the reading happens.

---

## 1. Schedule

`vercel.json` now declares three cron jobs:

| Path | Schedule | |
|---|---|---|
| `/api/cron/renew` | `0 6 * * *` | |
| `/api/cron/reconcile` | `0 3 * * *` | |
| `/api/cron/daily-card` | `0 2 * * *` | 04:00 Kyiv (GMT+2) |

Vercel crons run in **UTC**, hence `0 2` for a 04:00 Kyiv send. This project is on the
**Pro** plan, so the Hobby limits (two jobs, once per day, ±59 min) do not apply.

One global send time: a recipient in another timezone gets it whenever it lands, which is
why the copy says "your card for today" and never names an hour. Per-user timezones would
mean an hourly job and a stored offset — not worth it.

## 2. Content — the real cost

78 new short lines, one per card, **× 5 locales = 390 strings**. This is the bulk of the
work; everything else is a few hundred lines of code.

- New file `messages/{locale}/daily.json`, namespaced `{"daily": {…}}`, holding the
  subject, greeting, CTA label, and a `cards` map keyed by the ids already in
  `src/data.ts` (`arcana-0`, …).
- **No `src/i18n/request.ts` entry** — this namespace is read only by the mail sender,
  which imports the JSON directly the way `getResetEmailStrings()` already does in
  `mailer.ts`. Registering it would ship 78 strings into every page bundle for nothing.
  If a "card of the day" surface is ever added *in the app*, register it then.
- Voice: same register as the rest of the app — mystic, ironic, never self-describing.
  Per-reader voices are **out of scope**; 78 × 3 readers × 5 locales is a different
  project. The email speaks in the app's own voice and names the user's reader only in
  the CTA ("see what {reader} makes of it").

## 3. Opt-in

- Migration `add_daily_card_email`: `User.dailyCardEmail Boolean @default(false)`.
- **Off by default, subscribers only.** Nobody gets mail they did not ask for; the paid
  claim stays a subscriber perk. Turning it on is a profile row.
- Profile: a new **row** (`user-profile__field--row`) with an on/off control, following the
  existing row conventions. `PATCH /api/user/daily-card`. Add `dailyCardEmail` to the
  `jwt` callback's select in `src/lib/auth.ts` — per the standing gotcha, any new
  user-editable field left out of that select goes stale across sessions.
- **Unsubscribing:** `mailer.ts` already sets `List-Unsubscribe` to the profile URL, and
  the toggle will live there — so the header works with no new route. The in-body
  unsubscribe link points at the same place. Both require login; that is defensible for
  mail sent only to account holders, and it avoids minting yet another unauthenticated
  token surface.
- Entitlement is checked **at send time**, not only at opt-in — a lapsed subscriber with
  the flag still set must stop receiving it. Use `isActiveTier` via the shared helper;
  do not re-derive.

## 4. The draw

**Deterministic per user, from `userId` + the UTC date.** Hash the two, modulo 78. No DB
write, and a rerun of the job the same day produces the same card — which matters because
a retry or a run straddling midnight makes double-firing realistic.

- **Nothing is written to `Reading`.** The daily card is not a reading: it consumes no
  credit, hits no daily limit, and must not appear in the Ledger of Fates. Keeping it out
  of that table also keeps it out of the print/share/favourite surfaces, none of which
  make sense for it.
- Card art in the email is a `<img>` pointing at the absolute CDN URL for the user's
  `preferredDeck` (`getCardImagePath`) — no attachments, no transcoding. Note this is
  `.webp`; **Gmail and Apple Mail render WebP, Outlook desktop does not.** Either accept
  the fallback (alt text + the CTA link) or serve a PNG for mail. Decide before building;
  the OG-image work already has a `sharp` transcode path if PNG is wanted.

## 5. Sending — the limits that actually bite

- Send through `send()` in `src/lib/mailer.ts` with `unsubscribe: true`. Never build a
  transporter in the route — the shared sender carries the `from` display name that
  deliverability depends on.
- **Function timeout.** A serialized SMTP loop at ~1s per message fits roughly 250–300
  recipients in the 300s `maxDuration`. The route therefore pages 200 users per invocation
  and returns `nextCursor` when more remain — a cap that isn't reported reads as "everyone
  got mail" when they didn't. Nothing calls it with a cursor yet: past 200 opted-in
  subscribers, the follow-up pages need driving (a second scheduled hit, or a self-recall).
- **Zoho SMTP daily send caps are the real ceiling**, not Vercel. This is the first feature
  that scales with subscriber count rather than with events, so it hits that cap first, and
  silently — as bounces. Tracked in `STATUS.md`.
- **Failures are counted, not alerted.** The run logs `{day, sent, skipped, failed}` and
  returns it, but nothing pages anyone: a run that mails nobody looks identical to a quiet
  day unless someone reads the logs. The `STATUS.md` alerting gap (email `founder@` on job
  failure) covers this job too.
- `CRON_SECRET`-guarded like the other two cron routes.

## 6. What shipped

| Piece | Where |
|---|---|
| `User.dailyCardEmail`, default false | migration `20260802195021_add_daily_card_email` |
| Preference through NextAuth | `src/lib/auth.ts`, `src/types/next-auth.d.ts` |
| Opt-in endpoint | `src/app/api/user/daily-card/route.ts` |
| Deterministic pick (+7 tests) | `src/lib/dailyCard.ts`, `dailyCard.test.ts` |
| Locale copy loaders | `src/lib/dailyCardStrings.ts` |
| WebP→PNG card art | `src/app/api/card-image/route.ts` |
| The email itself | `sendDailyCardEmail()` in `src/lib/mailer.ts` |
| The job | `src/app/api/cron/daily-card/route.ts` |
| Profile row "The Daily Whisper" | `src/components/UserProfile.tsx` + 5 `ui` keys × 5 locales |
| Copy | `messages/{locale}/daily.json` — 78 cards × 5 locales |
| Schedule | `vercel.json` |

**`dailyCardEmail` is in the `jwt` callback's refresh select.** Per the standing gotcha,
a user-editable field left out of that select goes stale across sessions; the profile row
reads it from the session, so it would have shown the wrong state on a second device.

## 7. Decisions (2026-08-02)

- **Send hour: 04:00 Kyiv (GMT+2) → `"schedule": "0 2 * * *"`**, registered in
  `vercel.json`. Crons run in UTC.
- **Card art: PNG**, served by `/api/card-image`. Deck art is `.webp` and Outlook desktop
  cannot render it. Transcoded with `sharp` (already a direct dependency, same path the OG
  image uses).
- **The daily card is not a `Reading`.** It consumes no credit, hits no daily limit, and
  never appears in the Ledger of Fates — which also keeps it out of the print, share and
  favourite surfaces, none of which mean anything for it.

### Still open

- **Zoho's daily send cap** — the number for the current plan is unknown; tracked in
  `STATUS.md` → Account & platform gaps.
- **Paging past 200 recipients** — the cursor exists, nothing drives it yet.
- **Alerting on a failed run** — counted and logged only.
