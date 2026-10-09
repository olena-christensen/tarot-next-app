import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** The signed-in player's id, or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/** Reads a small JSON body; null if it isn't JSON. */
export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 40;
}

export const signInFirst = () => NextResponse.json({ error: "sign-in" }, { status: 401 });
export const badRequest = () => NextResponse.json({ error: "Invalid request" }, { status: 400 });
