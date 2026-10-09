import { NextResponse } from "next/server";
import { badRequest, currentUserId, isId, readBody, signInFirst } from "@/lib/castleGame/api";
import { getState, place } from "@/lib/castleGame/server";

/** Puts an owned item in a place in the room (what stood there goes back to the items). */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const body = await readBody(request);
  if (!body || !isId(body.rowId) || !isId(body.place)) return badRequest();
  const result = await place(userId, body.rowId, body.place);
  if (!result.ok) return NextResponse.json({ error: result.reason, state: await getState(userId) }, { status: 422 });
  return NextResponse.json({ state: await getState(userId) });
}
