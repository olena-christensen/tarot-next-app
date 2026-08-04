import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  hashVerifyToken,
  issueVerificationToken,
} from "@/lib/emailVerification";
import { sendVerificationEmail } from "@/lib/mailer";
import { routing } from "@/i18n/routing";

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app").replace(
    /\/$/,
    ""
  );
}

/**
 * Send (or resend) a verification link to the signed-in user's own address.
 *
 * Auth-gated on purpose: unlike the password-reset request, there is no reason
 * to accept an arbitrary email here, and accepting one would hand an attacker a
 * way to mail any address from your domain.
 *
 * Always answers `{ ok: true }` for a signed-in user — throttled, already
 * verified and mail-failed are indistinguishable to the client, so clicking
 * "resend" repeatedly reveals nothing and never looks broken.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { locale } = await request.json().catch(() => ({ locale: undefined }));
  const safeLocale = routing.locales.includes(locale)
    ? (locale as string)
    : routing.defaultLocale;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true, preferredLocale: true },
  });

  if (!user?.email || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const raw = await issueVerificationToken(session.user.id);
  if (!raw) return NextResponse.json({ ok: true }); // throttled

  const target = user.preferredLocale || safeLocale;
  await sendVerificationEmail({
    to: user.email,
    locale: target,
    link: `${appOrigin()}/${target}/verify-email?token=${raw}`,
  });

  return NextResponse.json({ ok: true });
}

/**
 * Consume a token. Unknown, expired and already-used all return the same
 * `invalid_token` — the page shows one "this link has withered" state, so a
 * probe learns nothing from which case it hit.
 */
export async function PUT(request: Request) {
  const { token } = await request.json().catch(() => ({ token: undefined }));
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerifyToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  // Stamp the user and burn every token they hold, in one transaction — a
  // half-applied verification would leave a live link against a verified
  // account.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
