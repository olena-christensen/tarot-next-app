import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, consumeRateLimit, REGISTER_BY_IP } from "@/lib/rateLimit";
import { issueVerificationToken } from "@/lib/emailVerification";
import { sendVerificationEmail } from "@/lib/mailer";
import { routing } from "@/i18n/routing";

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://theveil.app").replace(
    /\/$/,
    ""
  );
}

// Errors are machine CODES, never prose. The sign-up form renders whatever this
// returns, so an English sentence here lands untranslated on a Russian user's
// screen at the exact moment they are already stuck. The client owns the wording.
export async function POST(request: Request) {
  try {
    // Before any work: unlimited registration is free account creation, and
    // `emailVerified` is never checked, so those rows are indistinguishable
    // from real users.
    const { blocked, retryAfterSeconds } = await consumeRateLimit(
      `register:ip:${clientIp(request.headers)}`,
      REGISTER_BY_IP
    );
    if (blocked) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    const { name, email, password, acceptTerms, acceptAge, locale } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "missing_credentials" },
        { status: 400 }
      );
    }

    if (!acceptAge) {
      return NextResponse.json(
        { error: "age_required" },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: "terms_required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "weak_password" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "invalid_email" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "email_taken" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const created = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        termsAcceptedAt: new Date(),
      },
      select: { id: true },
    });

    // Best-effort: registration must succeed even if the mail does not. The
    // address is unverified either way, and the user can resend from the
    // checkout prompt — failing the sign-up over an SMTP blip would be worse.
    try {
      const raw = await issueVerificationToken(created.id);
      if (raw) {
        const safeLocale = routing.locales.includes(locale)
          ? (locale as string)
          : routing.defaultLocale;
        await sendVerificationEmail({
          to: email,
          locale: safeLocale,
          link: `${appOrigin()}/${safeLocale}/verify-email?token=${raw}`,
        });
      }
    } catch (err) {
      console.error("[register] verification email failed", err);
    }

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
