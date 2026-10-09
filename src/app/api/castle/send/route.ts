import { NextResponse } from "next/server";
import { badRequest, currentUserId, isId, readBody, signInFirst } from "@/lib/castleGame/api";
import { getState, send } from "@/lib/castleGame/server";

/** Sends an item to a friend: it leaves the room and waits for them (7 days). */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const body = await readBody(request);
  if (!body || !isId(body.rowId)) return badRequest();
  const result = await send(userId, body.rowId);
  if (!result.ok) return NextResponse.json({ error: result.reason, state: await getState(userId) }, { status: 422 });
  return NextResponse.json({ giftId: result.giftId, state: await getState(userId) });
}
