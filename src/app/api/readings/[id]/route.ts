import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_TITLE_LENGTH = 80;

type Params = { params: { id: string } };

/**
 * Rename a reading. An empty/whitespace title clears the name (back to null).
 * Scoped by userId as well as id, so one user can never touch another's row.
 * Not subscriber-gated — owning your own data doesn't depend on a plan.
 */
export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const raw = (body as { title?: unknown })?.title;
  if (raw !== null && typeof raw !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: "title_too_long" }, { status: 400 });
  }
  const title = trimmed.length > 0 ? trimmed : null;

  try {
    const { count } = await prisma.reading.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: { title },
    });
    if (count === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ title });
  } catch (err) {
    console.error("[readings] rename failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** Delete a single reading the caller owns. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { count } = await prisma.reading.deleteMany({
      where: { id: params.id, userId: session.user.id },
    });
    if (count === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[readings] delete failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
