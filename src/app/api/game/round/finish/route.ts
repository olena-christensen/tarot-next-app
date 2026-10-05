import { NextResponse } from "next/server";
import { currentOwner } from "@/lib/potionGame/owner";
import { finishRound, getProgress } from "@/lib/potionGame/reward";

/** Finishes a round; answers with today's progress (and the moonstone, at three). */
export async function POST(request: Request) {
  let roundId: unknown;
  try {
    ({ roundId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof roundId !== "string" || roundId.length > 40) {
    return NextResponse.json({ error: "Invalid round" }, { status: 400 });
  }

  const owner = await currentOwner();
  const result = await finishRound(roundId, owner);
  if (!result.ok) {
    // The potion still shows; it just doesn't count. Progress is sent anyway.
    return NextResponse.json(
      { error: result.reason, progress: await getProgress(owner) },
      { status: result.reason === "too-fast" ? 422 : 404 },
    );
  }
  return NextResponse.json({ progress: result.progress });
}
