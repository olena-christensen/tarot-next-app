import { NextResponse } from "next/server";
import { currentUserId, signInFirst } from "@/lib/castleGame/api";
import { getState, spin } from "@/lib/castleGame/server";

/** The wheel: today's free spin, then one paid spin (1 moonstone). */
export async function POST() {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const result = await spin(userId);
  if (!result.ok) return NextResponse.json({ error: result.reason, state: await getState(userId) }, { status: 422 });
  return NextResponse.json({ ...result, state: await getState(userId) });
}
