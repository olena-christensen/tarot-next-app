import { NextResponse } from "next/server";
import { currentUserId, signInFirst } from "@/lib/castleGame/api";
import { getState, throwParty } from "@/lib/castleGame/server";

/** Party night: the guests rate the hall; new bats pay moonstones once. */
export async function POST() {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const result = await throwParty(userId);
  if (!result.ok) return NextResponse.json({ error: result.reason, state: await getState(userId) }, { status: 422 });
  return NextResponse.json({ ...result, state: await getState(userId) });
}
