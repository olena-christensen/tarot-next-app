import { NextResponse } from "next/server";
import { currentOwner } from "@/lib/potionGame/owner";
import { takeGift } from "@/lib/potionGame/reward";

/** A friend takes a potion that was sent to them. Signed-in players only. */
export async function POST(request: Request) {
  let roundId: unknown;
  try {
    ({ roundId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof roundId !== "string" || roundId.length > 40) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const owner = await currentOwner();
  if (!owner.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await takeGift(roundId, { ...owner, userId: owner.userId });
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });
  return NextResponse.json({ progress: result.progress });
}
