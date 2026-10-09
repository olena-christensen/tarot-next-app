import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/castleGame/api";
import { getState } from "@/lib/castleGame/server";

export const dynamic = "force-dynamic";

/** The player's castle: moonstones, items and where they stand, today's spins. */
export async function GET() {
  return NextResponse.json(await getState(await currentUserId()));
}
