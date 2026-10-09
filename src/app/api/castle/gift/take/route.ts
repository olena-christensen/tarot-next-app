import { NextResponse } from "next/server";
import { badRequest, currentUserId, isId, readBody, signInFirst } from "@/lib/castleGame/api";
import { takeGift } from "@/lib/castleGame/server";

/** A friend takes an item someone sent them. */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const body = await readBody(request);
  if (!body || !isId(body.giftId)) return badRequest();
  const result = await takeGift(body.giftId, userId);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
  return NextResponse.json({ itemId: result.itemId });
}
