# Monitoring and alerting

How the app tells you it is broken, and the three ways it failed to.

## The outage that exposed it, 2026-08-06

Neon was unreachable between 02:01 and 03:00 (Coordinated Universal Time). The hourly
reconcile sweep failed at 03:00, 04:00 and 05:00, then recovered on its own. Email was not
affected — the daily card went out normally at 02:00.

The outage was not the problem. Three hours of silence were.

**Every cron route reported only at the end of a run.** `alertOnJobFailures` and
`recordHeartbeat` are the last two statements. A run that *threw* skipped both, so a crash
produced a 500 and nothing else. `alertOnJobFailures` only fires on errors counted inside
the loop; a crash never reaches it.

**Heartbeats live in the same database as the job.** A job that cannot connect cannot record
that it failed either. Both internal safety nets shared the single point of failure they
were built to watch.

**The external monitor was watching the wrong thing.** UptimeRobot pinged `theveil.app`,
which needs no database, so it stayed green throughout.

It surfaced only because the recovered run checks every heartbeat *before* stamping its own,
and so reported its own three-hour gap — by design, but three hours late.

Root cause of the outage itself: unknown, and **not** compute exhaustion — usage was 5.6 of
100 compute-unit-hours. Neon published no incident. Most likely an unreported wake failure.

## What exists now

**`src/lib/cronJob.ts` — `runCronJob(name, work)`.** Wraps all four cron routes, catches a
throw, mails the operator, returns 500. Auth stays in the route, so an unauthorized call is
rejected before the wrapper runs and never mails.

It survives a database outage because `consumeRateLimit` already fails open — the alert
throttle cannot block the one message that matters. The cost is one email per run while an
outage lasts, which for the hourly sweep is one an hour.

**`src/app/api/health` — the liveness probe.** Runs `SELECT 1`; no table, no row, no
migration dependency. Returns 503 when the database is down, because that is what an uptime
monitor alarms on, and it is honest: the app is up, its dependency is not.

**Reconcile has an explicit `maxDuration = 120` and a 90-second deadline** reporting
`remaining: true`. Rows left behind match the same query next hour, so nothing is lost, and
the heartbeat is always reached.

**Heartbeats.** Each job stamps `JobHeartbeat` at the end of a run. The hourly reconcile
sweep checks every job's heartbeat *before* stamping its own, so a job returning from an
outage reports its own gap instead of overwriting the evidence.

## UptimeRobot configuration, and why the intervals are what they are

- `theveil.app` — every 5 minutes. Costs nothing; catches the site or host dying.
- `/api/health` — every **30 minutes**.

Neon suspends the compute after 5 minutes of inactivity. A database-touching check more
often than that never lets it sleep: around the clock costs roughly 182 compute-unit-hours
a month against a free-plan allowance of 100, and when that runs out **the compute is
suspended until the next billing period**. Monitoring would cause a multi-day outage.

At 30 minutes it costs about 36 compute-unit-hours a month, on top of roughly 28 from real
traffic and the hourly cron. Comfortable under 100.

## The actual cause of the repeated outages, 2026-08-08

After the crash guard landed, the same failure kept arriving: "Can't reach database server",
several times a day, with usage at 5.6 of 100 compute-unit-hours and no Neon incident.

The health endpoint's own response header gave it away. `x-vercel-id: fra1::iad1::…` — the
request entered at Frankfurt and the **function executed in `iad1`, Washington**. The
database is in `eu-central-1`, Frankfurt. Every query crossed the Atlantic and back.

Nobody chose that. Vercel puts serverless functions in `iad1` unless the project says
otherwise; the database went to Frankfurt because that is where the audience is. Two
defaults, never reconciled, since the project was created.

**Fix:** `"regions": ["fra1"]` in `vercel.json`. Requires the Pro plan; on Hobby the region
is fixed.

**Measured:** `SELECT 1` through the health endpoint went from 1895 ms to 304 ms, and the
compute slot in `x-vercel-id` changed from `iad1` to `fra1`.

**Check this first on any new project.** A long, fragile link fails far more often than a
short one, and every symptom it produces looks like the database being unreliable.

## Retrying a sleeping compute

`src/lib/dbWake.ts` — `withDbWake(job, work)` wraps the FIRST query of each cron job. One
retry, after 3 seconds, on connection failures only. A query that reaches the database and
fails still surfaces immediately; retrying a constraint violation would hide a bug instead
of an outage.

Two attempts, not five: this covers a cold start, not an outage. If the second fails, the
crash guard reports it and the run still counts as missed.

## Known weakness

Stale-job alerts now throttle to once per day (`STALE_JOB_THROTTLE` in `src/lib/alert.ts`,
keyed on the `heartbeat:` prefix). Alerts about a job actively failing stay hourly, because
each of those is new information; a stale heartbeat is the same fact restated.

Still imperfect: it alerts daily rather than on the transition from healthy to stale.
