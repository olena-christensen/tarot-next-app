import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
// mime → file extension for the allowed image types
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
// Only our own Blob URLs get cleaned up on replace — never an OAuth avatar URL.
const BLOB_HOST = ".public.blob.vercel-storage.com";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "bad_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  // Current image, so we can delete the old blob after a successful replace.
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  let url: string;
  try {
    const blob = await put(`avatars/${userId}-${Date.now()}.${ext}`, file, {
      access: "public",
      contentType: file.type,
    });
    url = blob.url;
  } catch (err) {
    console.error("[avatar] blob put failed", err);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { image: url },
  });

  // Best-effort cleanup of the previous avatar (only blobs we own).
  const prev = current?.image;
  if (prev && prev.includes(BLOB_HOST)) {
    try {
      await del(prev);
    } catch {
      // an orphaned blob is harmless — ignore
    }
  }

  return NextResponse.json({ url });
}
