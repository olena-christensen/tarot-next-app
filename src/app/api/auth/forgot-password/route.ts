import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import {
  RESET_TOKEN_TTL_MS,
  RESET_THROTTLE_MS,
  generateResetToken,
  hashResetToken,
  getResetEmailStrings,
} from "@/lib/passwordReset";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Request a password-reset link.
 *
 * ALWAYS answers `{ ok: true }` once the payload is well-formed — whether the
 * address exists, has no password (Google-only), or is being hammered. Any
 * variation would turn this into an account-enumeration oracle.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { email, locale } = (body ?? {}) as { email?: unknown; locale?: unknown };
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const address = email.trim();
  const userLocale = typeof locale === "string" ? locale : "en";

  try {
    const user = await prisma.user.findUnique({
      where: { email: address },
      select: { id: true, password: true, preferredLocale: true },
    });

    // No account, or a Google-only account with no password to reset: stop here
    // silently. Sending "you signed up with Google" would leak how they signed up.
    if (user?.password) {
      const recent = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      const throttled =
        recent !== null &&
        Date.now() - recent.createdAt.getTime() < RESET_THROTTLE_MS;

      if (!throttled) {
        // One live link at a time — requesting a new one retires the old.
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        const raw = generateResetToken();
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashResetToken(raw),
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        });

        await sendResetEmail({
          to: address,
          // Their saved preference wins over the locale of the browser they're on.
          locale: user.preferredLocale || userLocale,
          token: raw,
        });
      }
    }
  } catch (err) {
    // Never surface the reason — a failure here must look identical to success.
    console.error("[forgot-password] request failed", err);
  }

  return NextResponse.json({ ok: true });
}

async function sendResetEmail({
  to,
  locale,
  token,
}: {
  to: string;
  locale: string;
  token: string;
}) {
  const smtpUser = process.env.ZOHO_SMTP_USER;
  const smtpPass = process.env.ZOHO_SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error("[forgot-password] missing ZOHO_SMTP_USER or ZOHO_SMTP_PASS");
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app";
  const link = `${appUrl}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
  const t = await getResetEmailStrings(locale);

  const transporter = nodemailer.createTransport({
    host: "smtppro.zoho.eu",
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    // Zoho rejects a from: that isn't the authenticated mailbox.
    from: smtpUser,
    to,
    subject: t.resetEmailSubject,
    text: `${t.resetEmailIntro}\n\n${link}\n\n${t.resetEmailExpiry}\n${t.resetEmailIgnore}`,
    html:
      `<p>${t.resetEmailIntro}</p>` +
      `<p><a href="${link}">${t.resetEmailCta}</a></p>` +
      `<p>${t.resetEmailExpiry}</p>` +
      `<p>${t.resetEmailIgnore}</p>`,
  });
}
