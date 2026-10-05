import { NextResponse } from "next/server";
import { currentOwner } from "@/lib/potionGame/owner";
import { getProgress } from "@/lib/potionGame/reward";

/**
 * Today's potions. POST, not GET: for a player who has just signed in it moves
 * their earlier rounds to the account and can add the day's moonstone.
 */
export async function POST() {
  const owner = await currentOwner();
  return NextResponse.json({ progress: await getProgress(owner) });
}
