import { NextResponse } from "next/server";
import { currentOwner } from "@/lib/potionGame/owner";
import { decideRound } from "@/lib/potionGame/reward";

/** "Keep it" or "Send it to a friend" on the end screen. */
export async function POST(request: Request) {
  let body: { roundId?: unknown; outcome?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { roundId, outcome } = body;
  if (typeof roundId !== "string" || roundId.length > 40 || (outcome !== "kept" && outcome !== "sent")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const progress = await decideRound(roundId, outcome, await currentOwner());
  if (!progress) return NextResponse.json({ error: "not-found" }, { status: 404 });
  return NextResponse.json({ progress });
}
