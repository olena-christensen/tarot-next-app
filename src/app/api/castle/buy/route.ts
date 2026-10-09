import { NextResponse } from "next/server";
import { badRequest, currentUserId, isId, readBody, signInFirst } from "@/lib/castleGame/api";
import { buy, getState } from "@/lib/castleGame/server";

/** Buys one item from the catalog with moonstones. */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const body = await readBody(request);
  if (!body || !isId(body.itemId)) return badRequest();
  const result = await buy(userId, body.itemId);
  if (!result.ok) return NextResponse.json({ error: result.reason, state: await getState(userId) }, { status: 422 });
  return NextResponse.json({ rowId: result.rowId, state: await getState(userId) });
}
