import { NextResponse } from "next/server";
import { alertOps } from "./alert";

/**
 * Crash guard for the scheduled jobs.
 *
 * Every cron route reports for itself at the END of a run: `alertOnJobFailures`
 * and `recordHeartbeat` are the last two statements. That covers a run which
 * completes with failures counted inside it, and covers nothing at all when the
 * run THROWS — the error leaves the handler, both calls are skipped, and the job
 * fails in total silence.
 *
 * Found the hard way on 2026-08-06: the database was unreachable for about three
 * hours, prisma threw on the first query of the hourly reconcile sweep, and every
 * run in that window died before it could either alert or stamp a heartbeat. The
 * only reason it surfaced at all was the run that recovered afterwards noticing
 * its own stale heartbeat — three hours late.
 *
 * This wraps the body so a thrown error still mails the operator. It depends on
 * nothing but the mailer: `alertOps`' throttle already fails open when the
 * database is down (see `consumeRateLimit`), so a database outage — the most
 * likely reason a job crashes rather than merely failing — still gets through.
 * The cost is one email per run for as long as the outage lasts, which for the
 * hourly sweep is one an hour. That is the correct trade: the throttle exists to
 * stop a flood, and a job that runs once an hour cannot flood anything.
 *
 * Auth stays in the route. This wrapper deliberately does not see the request,
 * so an unauthorized call is rejected before any of this runs and never mails.
 */
export async function runCronJob<T>(
  job: string,
  work: () => Promise<T>
): Promise<NextResponse> {
  try {
    return NextResponse.json(await work());
  } catch (err) {
    console.error(`[cron/${job}] crashed`, err);

    const message = err instanceof Error ? err.message : String(err);
    await alertOps(
      `cron:${job}:crash`,
      `[theveil] ${job} crashed`,
      [
        `The ${job} job threw before it could finish, so it reported nothing of`,
        "its own and recorded no heartbeat for this run.",
        "",
        message,
        "",
        "The most common cause is the database being unreachable. Check the Neon",
        "console for the project, then the Vercel runtime logs for this function",
        "— the full stack trace is there, not in this email.",
      ]
    );

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
