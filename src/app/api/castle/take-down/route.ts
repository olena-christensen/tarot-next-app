import { NextResponse } from "next/server";
import { badRequest, currentUserId, isId, readBody, signInFirst } from "@/lib/castleGame/api";
import { getState, takeDown } from "@/lib/castleGame/server";

/** Takes an item out of the room, back to the player's items. */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const body = await readBody(request);
  if (!body || !isId(body.rowId)) return badRequest();
  const result = await takeDown(userId, body.rowId);
  if (!result.ok) return NextResponse.json({ error: result.reason, state: await getState(userId) }, { status: 422 });
  return NextResponse.json({ state: await getState(userId) });
}
