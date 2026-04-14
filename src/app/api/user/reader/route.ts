import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { READER_IDS } from "@/lib/readers";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredReader: true },
  });

  return NextResponse.json({ reader: user?.preferredReader ?? "vespera" });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reader } = await request.json();

  if (typeof reader !== "string" || !READER_IDS.includes(reader as any)) {
    return NextResponse.json(
      { error: "Invalid reader" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredReader: reader },
  });

  return NextResponse.json({ reader });
}
