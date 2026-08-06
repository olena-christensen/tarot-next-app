import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liveness probe for the external monitor (UptimeRobot).
 *
 * The point is that it TOUCHES THE DATABASE. Pinging the home page proves only
 * that Vercel is serving; a statically rendered page keeps returning 200 through
 * a total database outage, which is exactly what happened on 2026-08-06 — the
 * database was unreachable for about three hours, every scheduled job died, and
 * the external monitor stayed green the whole time because nothing it looked at
 * needed a database.
 *
 * `SELECT 1` is deliberate: it proves a connection can be opened and a query
 * round-tripped, without depending on any table, row or migration state. Cheap
 * enough to be safe as an unauthenticated endpoint hit every few minutes.
 *
 * Returns 503 rather than 500 when the database is down, because that is what an
 * uptime monitor is built to alarm on, and it is honest — the app is up, its
 * dependency is not.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A probe that hangs is a probe that reports nothing. Fail fast instead.
export const maxDuration = 10;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const;

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, database: "up", ms: Date.now() - startedAt },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[health] database unreachable", err);
    return NextResponse.json(
      { ok: false, database: "down", ms: Date.now() - startedAt },
      { status: 503, headers: NO_STORE }
    );
  }
}
