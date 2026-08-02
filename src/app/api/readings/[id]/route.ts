import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_TITLE_LENGTH = 80;
const MAX_NOTE_LENGTH = 2000;

type Params = { params: { id: string } };

/**
 * Edit a reading's user-owned fields: `title`, `note`, `isFavorite`. Each is
 * optional — only the keys present in the body are written, so the star toggle
 * can PATCH `isFavorite` alone without clearing a note.
 *
 * Empty/whitespace title or note clears that field back to null. Scoped by
 * userId as well as id, so one user can never touch another's row. Not
 * subscriber-gated — owning your own data doesn't depend on a plan.
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

  const payload = (body ?? {}) as {
    title?: unknown;
    note?: unknown;
    isFavorite?: unknown;
  };
  const data: { title?: string | null; note?: string | null; isFavorite?: boolean } =
    {};

  if ("title" in payload) {
    const raw = payload.title;
    if (raw !== null && typeof raw !== "string") {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    if (trimmed.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ error: "title_too_long" }, { status: 400 });
    }
    data.title = trimmed.length > 0 ? trimmed : null;
  }

  if ("note" in payload) {
    const raw = payload.note;
    if (raw !== null && typeof raw !== "string") {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    if (trimmed.length > MAX_NOTE_LENGTH) {
      return NextResponse.json({ error: "note_too_long" }, { status: 400 });
    }
    data.note = trimmed.length > 0 ? trimmed : null;
  }

  if ("isFavorite" in payload) {
    if (typeof payload.isFavorite !== "boolean") {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    data.isFavorite = payload.isFavorite;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const { count } = await prisma.reading.updateMany({
      where: { id: params.id, userId: session.user.id },
      data,
    });
    if (count === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[readings] update failed", err);
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
