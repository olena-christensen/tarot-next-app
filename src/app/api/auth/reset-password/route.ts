import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/passwordReset";

const MIN_PASSWORD_LENGTH = 8;

/** Consume a reset link and set the new password. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { token, password } = (body ?? {}) as {
    token?: unknown;
    password?: unknown;
  };
  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        // Returned on success so the client can sign in immediately. Safe: only
        // someone holding a valid token gets here, and they just set the password.
        user: { select: { email: true } },
      },
    });

    // Unknown, already spent, or expired all fail the same way — no hints.
    if (
      !record ||
      record.usedAt !== null ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Any other outstanding link for this user dies with the reset.
      prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId, id: { not: record.id } },
      }),
    ]);

    return NextResponse.json({ ok: true, email: record.user.email });
  } catch (err) {
    console.error("[reset-password] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
