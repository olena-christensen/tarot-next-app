/**
 * Absorbs a Neon compute that fails to wake.
 *
 * Neon suspends the compute after 5 minutes of inactivity. At this traffic the
 * database is asleep most of the time, so the hourly cron is frequently the
 * thing waking it — and if that wake fails, the job dies on its very first
 * query with "Can't reach database server". Prisma does not retry connection
 * errors, and the next attempt is an hour away.
 *
 * Happened twice in 24 hours (2026-08-06 and 2026-08-07) with usage at 5.6 of
 * 100 compute-unit-hours, so it is not the allowance, and Neon published no
 * incident either time. Both were transient: the database was reachable again
 * within minutes, and both would have been swallowed by a single retry.
 *
 * Deliberately narrow:
 *   - Only CONNECTION failures retry. A query that reaches the database and
 *     fails is a real bug and must surface immediately, not three seconds later.
 *   - Two attempts, not five. This covers a cold start, not an outage. A real
 *     outage still fails, still alerts, and still shows up as a missed run.
 *   - Wrap the FIRST query of a job, not every query. Once the compute is awake
 *     it stays awake for the rest of the run.
 */

/** Neon/Postgres connection failures. Everything else is a real error. */
const CONNECTION_ERROR_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server reachable but timed out
  "P1017", // Server has closed the connection
]);

function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const code = (err as { code?: unknown }).code;
  if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) return true;

  // Prisma does not always surface a code on initialization errors, and the
  // message is the only thing that distinguishes "asleep" from "broken".
  const name = (err as { name?: unknown }).name;
  if (name === "PrismaClientInitializationError") return true;

  const message = (err as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    (message.includes("Can't reach database server") ||
      message.includes("the database server at") ||
      message.includes("Connection terminated") ||
      message.includes("Server has closed the connection"))
  );
}

const WAKE_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run `work`, retrying ONCE if it failed because the database was unreachable.
 *
 * Use it around the first database call of a scheduled job:
 *
 *   const rows = await withDbWake("reconcile", () => prisma.payment.findMany(...));
 *
 * `job` appears in the log line only, so a swallowed wake failure is still
 * visible in the Vercel logs rather than being completely invisible.
 */
export async function withDbWake<T>(
  job: string,
  work: () => Promise<T>
): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (!isConnectionError(err)) throw err;

    console.warn(
      `[db-wake] ${job}: database unreachable, retrying once in ${WAKE_DELAY_MS}ms`,
      err
    );
    await sleep(WAKE_DELAY_MS);

    // No second catch: if the retry fails too, this is not a sleeping compute
    // and the caller's crash guard must report it.
    return work();
  }
}
