import { NextResponse } from "next/server";
import { clientIp, consumeRateLimit, type RateLimitRule } from "@/lib/rateLimit";
import { currentOwner } from "@/lib/potionGame/owner";
import { startRound } from "@/lib/potionGame/reward";

/** A round takes at least ten seconds, so this is far above real play. */
const ROUNDS_BY_IP: RateLimitRule = {
  limit: 60,
  windowMs: 10 * 60 * 1000,
  blockMs: 10 * 60 * 1000,
};

/** Starts a timed round of "Brew the Potion". */
export async function POST(request: Request) {
  const limit = await consumeRateLimit(`potion:ip:${clientIp(request.headers)}`, ROUNDS_BY_IP);
  if (limit.blocked) {
    return NextResponse.json(
      { error: "Too many rounds" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  const owner = await currentOwner({ createAnon: true });
  const roundId = await startRound(owner);
  return NextResponse.json({ roundId });
}
