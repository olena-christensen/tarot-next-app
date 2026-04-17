import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredLocale: true },
  });

  return NextResponse.json({ locale: user?.preferredLocale ?? "en" });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { locale } = await request.json();

  if (typeof locale !== "string" || !routing.locales.includes(locale as any)) {
    return NextResponse.json(
      { error: "Invalid locale" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredLocale: locale },
  });

  return NextResponse.json({ locale });
}
