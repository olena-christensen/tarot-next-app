import { NextResponse } from "next/server";
import { badRequest, currentUserId, isId, readBody, signInFirst } from "@/lib/castleGame/api";
import { getState, unsend } from "@/lib/castleGame/server";

/** The share window closed without sending: the item goes back to the vault. */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return signInFirst();
  const body = await readBody(request);
  if (!body || !isId(body.rowId)) return badRequest();
  await unsend(userId, body.rowId);
  return NextResponse.json({ state: await getState(userId) });
}
