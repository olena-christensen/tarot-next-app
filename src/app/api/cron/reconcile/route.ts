import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInvoiceStatus } from "@/lib/mono";
import { applyMonoInvoiceStatus } from "@/lib/paymentActivation";
import { pruneRateLimits } from "@/lib/rateLimit";
import { alertOnJobFailures, alertOps } from "@/lib/alert";
import {
  checkJobHeartbeats,
  formatSilence,
  recordHeartbeat,
} from "@/lib/heartbeat";
import { runCronJob } from "@/lib/cronJob";

// Reconciliation sweep. A payment only activates when mono delivers its webhook;
// if that delivery is ever lost, the Payment ledger row (and its Subscription)
// stays stuck at created/processing and the customer's credit/tier never lands.
// Runs hourly, polling mono for the true status of any ledger row stuck past
// STUCK_MS and applying it through the SAME path as the webhook
// (applyMonoInvoiceStatus) — idempotent, so it's safe even if a real webhook
// lands at the same moment (the activatedInvoiceId compare-and-set dedupes).
//
// Bearer-auth via CRON_SECRET: Vercel attaches `Authorization: Bearer
// ${CRON_SECRET}` automatically, so we reject anything else (same as cron/renew).

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Every stuck row costs one network round-trip to mono, so a slow or unreachable
// acquirer is what is most likely to stretch this run. Bounded explicitly rather
// than inheriting the platform default, which is short enough that a handful of
// slow calls could kill the run before it reaches its heartbeat — and a run that
// dies before its heartbeat is a run nobody hears about.
export const maxDuration = 120;

// Only reconcile after 30 min unconfirmed — a real payment confirms in seconds,
// so this avoids poking an invoice the user is still actively paying.
//
// The upper bound was 7 days, which orphaned anything older: mono knew the
// invoice had expired, we still said "created", and nothing would ever correct
// it (found 2026-08-02 on a 28-June checkout). It is now 90 days, and the sweep
// can't grow unbounded because `expired` is handled as terminal — a row is
// resolved once and then drops out of the created/processing filter for good.
const STUCK_MS = 30 * 60 * 1000;
const WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Stop starting new work after this long and report `remaining: true`.
 * `maxDuration` is 120s; the headroom covers the mono call already in flight
 * plus the heartbeat write that must still happen.
 */
const DEADLINE_MS = 90_000;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Wrapped so a throw still reaches the inbox: everything below reports at the
  // END of the run, which is no help when the run dies at the first query.
  return runCronJob("reconcile", reconcileSweep);
}

async function reconcileSweep() {
  const startedAt = Date.now();
  const now = new Date();
  const stuckBefore = new Date(now.getTime() - STUCK_MS);
  const giveUpBefore = new Date(now.getTime() - WINDOW_MS);

  const stuck = await prisma.payment.findMany({
    where: {
      status: { in: ["created", "processing"] },
      createdAt: { lt: stuckBefore, gte: giveUpBefore },
    },
    select: { monoInvoiceId: true },
  });

  let reconciled = 0;
  let stillPending = 0;
  let errors = 0;
  let remaining = false;

  for (const { monoInvoiceId } of stuck) {
    // Hand the rest to the next sweep rather than being killed mid-loop. The
    // heartbeat and the watchman below are what must not be skipped, and any row
    // left behind matches the same query again in an hour — nothing is lost.
    if (Date.now() - startedAt > DEADLINE_MS) {
      remaining = true;
      break;
    }

    try {
      const res = await getInvoiceStatus(monoInvoiceId);
      if (!res.status) {
        console.warn(`[cron/reconcile] no status for invoiceId ${monoInvoiceId}`);
        errors++;
        continue;
      }

      await applyMonoInvoiceStatus(
        {
          invoiceId: monoInvoiceId,
          status: res.status,
          cardToken: res.walletData?.cardToken,
          maskedPan: res.paymentInfo?.maskedPan,
          paymentSystem: res.paymentInfo?.paymentSystem,
          failureReason: res.failureReason,
        },
        now
      );

      if (
        res.status === "success" ||
        res.status === "failure" ||
        res.status === "reversed" ||
        res.status === "expired"
      ) {
        // Settled — this row won't be picked up again next sweep.
        reconciled++;
      } else {
        // Still created/processing on mono's side — leave it for a later sweep.
        stillPending++;
      }
    } catch (err) {
      console.error(
        `[cron/reconcile] failed for invoiceId ${monoInvoiceId}`,
        err
      );
      errors++;
    }
  }

  // Piggybacked on the hourly sweep rather than given its own cron: rate-limit
  // rows are bounded by distinct keys, so this is housekeeping, not a job.
  const prunedRateLimits = await pruneRateLimits(
    new Date(now.getTime() - 24 * 60 * 60 * 1000)
  );

  // The watchman. Runs BEFORE this sweep stamps its own heartbeat, so a
  // reconcile that was down for hours and has just come back reports its own
  // gap rather than quietly overwriting the evidence.
  const stale = await checkJobHeartbeats(now);
  for (const job of stale) {
    await alertOps(
      `heartbeat:${job.job}`,
      `[theveil] ${job.job} has not run for ${formatSilence(job.silentForMs)}`,
      [
        `The ${job.job} job last completed at ${job.lastSeen.toISOString()}.`,
        `That is ${formatSilence(job.silentForMs)} ago; it is expected at least every ${formatSilence(job.allowedMs)}.`,
        "",
        "Check the Cron Jobs tab in Vercel — the usual cause is a schedule that",
        "was dropped by a deploy, or a function erroring before it can report.",
      ]
    );
  }

  const result = {
    ok: true,
    scanned: stuck.length,
    reconciled,
    stillPending,
    errors,
    remaining,
    prunedRateLimits,
    staleJobs: stale.map((s) => s.job),
  };
  await alertOnJobFailures("reconcile", result);
  await recordHeartbeat("reconcile", result);

  return result;
}
