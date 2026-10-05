import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ANON_COOKIE, type Owner } from "./reward";

const ANON_ID_RE = /^[a-f0-9-]{36}$/;
const YEAR_S = 365 * 24 * 60 * 60;

/**
 * Who is playing: the signed-in account, and the visitor cookie if there is one
 * (kept after sign-in so today's earlier rounds can move to the account).
 * `createAnon` gives a visitor without a cookie a new one.
 */
export async function currentOwner({ createAnon = false } = {}): Promise<Owner> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const jar = cookies();
  let anonId = jar.get(ANON_COOKIE)?.value ?? null;
  if (anonId && !ANON_ID_RE.test(anonId)) anonId = null;

  if (!anonId && !userId && createAnon) {
    anonId = crypto.randomUUID();
    jar.set(ANON_COOKIE, anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: YEAR_S,
    });
  }
  return { userId, anonId };
}
