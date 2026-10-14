import { NextResponse } from "next/server";
import { currentUserId, signInFirst } from "@/lib/castleGame/api";
import { clearHall, getState } from "@/lib/castleGame/server";

/** Clear the hall: everything placed goes back to the player's items. */
export async function POST() {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  await clearHall(userId);
  return NextResponse.json({ ok: true, state: await getState(userId) });
}
