# Reading Reminder ("The Nudge")

**Status:** built and scheduled, 2026-08-03.

Makes good on the MONTHLY claim "Reminder notifications", which the code did not back.

An opt-in email to a subscriber who hasn't drawn in a while. Deliberately narrow: no
push notifications, no per-user schedules, no "remind me at 9am" — those need a
permissions UX and a stored timezone, and neither is what the pricing line promises.

## The rule

Lives in `src/lib/readingReminder.ts`, pure and unit-tested, so "when do we nudge" isn't
buried in a route handler. Two clocks, both must pass:

- **Idle** — nothing drawn for `IDLE_DAYS` (7). Someone who has *never* drawn is measured
  from `createdAt` instead; a null would otherwise either exempt them forever or mail them
  the day they registered.
- **Cooldown** — at most one every `COOLDOWN_DAYS` (7), tracked in `User.reminderSentOn`.
  The job runs daily and the nudge must not: without this, someone who stays away gets one
  every morning, which is how a reminder becomes a reason to unsubscribe.

An unparseable stamp is ignored rather than treated as recent — a bad value must not
silence someone permanently.

## Opt-in

`User.readingReminder`, off by default, subscribers only (migration
`add_reading_reminder`). `PATCH /api/user/reading-reminder` returns 403
`subscription_required` when switching **on** without an active tier; switching **off** is
always allowed so a lapsed user can stop the mail.

Opting in clears `reminderSentOn`, so someone who turns it back on isn't held to the
previous run's cooldown.

Entitlement is re-checked at send time via `isActiveTier` — a subscription that lapsed
after the toggle was flipped stops producing mail without anyone clearing the flag.

`readingReminder` is in the `jwt` callback's refresh select. Per the standing gotcha, a
user-editable field left out of that select goes stale across sessions, and the profile row
reads it from the session.

## The email

`src/lib/reminderEmail.ts`, same construction as `dailyCardEmail.ts` — nested tables,
inline styles, flat hexes (Outlook drops `rgba()`), absolute URLs, no CTA button.

**No card art**, unlike the daily card. This email is about the deck sitting untouched;
showing a card would give away the one thing worth opening the app for.

Copy is `messages/{locale}/reminder.json`, all five locales, **not** registered in
`src/i18n/request.ts` — nothing in the app UI reads it, same as `daily.json`.

## The job

`/api/cron/reading-reminder`, `CRON_SECRET`-guarded, `0 16 * * *` (18:00 Kyiv). Evening
rather than the daily card's 04:00: two emails landing within minutes of each other reads
as spam from one sender.

Cursor-paged at 200 users, returns `{day, sent, skipped, failed, nextCursor}`. `sent`
means SMTP accepted; a refusal leaves `reminderSentOn` untouched so tomorrow retries
rather than starting a week-long cooldown on an email that never left.

Only the newest reading's timestamp is selected per user — the whole ledger isn't needed
to answer "when did they last draw".

Trigger it by hand with `npm run cron:reading-reminder -- https://theveil.app`.

## Still open

- Shares the Zoho send cap with the daily card — see `STATUS.md`.
- Paging past 200 recipients: the cursor exists, nothing drives it.
- No alerting on a failed run; counted and logged only.
- **Not seen live.** Built, typechecked, and unit-tested; no reminder has been sent, and
  triggering one needs an account that has been idle for seven days.
