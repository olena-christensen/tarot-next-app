import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

/** Short, URL-safe, unguessable — the link IS the credential. */
function mintShareId(): string {
  return crypto.randomBytes(9).toString("base64url");
}

/**
 * Publish a reading. Idempotent: re-sharing returns the existing link rather
 * than minting a second one, so a user can't accumulate live URLs they've
 * forgotten about. Auth-only, not subscriber-gated — sharing your own data
 * doesn't depend on a plan.
 */
export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const reading = await prisma.reading.findFirst({
      where: { id: params.id, userId: session.user.id },
      select: { id: true, shareId: true },
    });
    if (!reading) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (reading.shareId) {
      return NextResponse.json({ shareId: reading.shareId });
    }

    const shareId = mintShareId();
    await prisma.reading.update({
      where: { id: reading.id },
      data: { shareId },
    });
    return NextResponse.json({ shareId });
  } catch (err) {
    console.error("[readings] share failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** Revoke the link. The public page 404s immediately afterwards. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { count } = await prisma.reading.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: { shareId: null },
    });
    if (count === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[readings] unshare failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
