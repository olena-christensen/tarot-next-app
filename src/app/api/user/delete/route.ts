import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import nodemailer from "nodemailer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GDPR account deletion. Cascades cover Account/Session/Reading/Subscription;
// VerificationToken keys on `identifier` (email) so it must be cleared manually
// inside the same transaction.

const CONFIRMATION_TOKEN = "DELETE";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const { confirm } = payload as Record<string, unknown>;
  if (confirm !== CONFIRMATION_TOKEN) {
    return NextResponse.json({ ok: false, error: "Invalid confirmation" }, { status: 400 });
  }

  let deletedEmail: string | null = null;

  try {
    deletedEmail = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.email) {
        await tx.verificationToken.deleteMany({
          where: { identifier: user.email },
        });
      }

      await tx.user.delete({ where: { id: session.user.id } });

      return user.email;
    });
  } catch (err) {
    console.error("[delete-account] transaction failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (deletedEmail) {
    await sendDeletionConfirmation(deletedEmail);
  }

  return NextResponse.json({ ok: true });
}

async function sendDeletionConfirmation(email: string) {
  const smtpUser = process.env.ZOHO_SMTP_USER;
  const smtpPass = process.env.ZOHO_SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error("[delete-account] missing ZOHO_SMTP_USER or ZOHO_SMTP_PASS — skipping confirmation email");
    return;
  }

  const timestamp = new Date().toISOString();
  const subject = "[theveil] Account deleted";
  const text = [
    "Your account at The Veil has been permanently deleted.",
    "",
    "The following data has been removed:",
    "  • Your account profile (name, email, password, preferences)",
    "  • All linked sign-in providers (Google, etc.)",
    "  • Your reading history",
    "  • Any active subscription record",
    "  • Your payment history",
    "  • Pending email verification tokens",
    "",
    `Deleted (UTC): ${timestamp}`,
    "",
    "This action is irreversible. If you did not request this deletion, contact privacy@nothingweird.agency immediately.",
    "",
    "— The Veil",
  ].join("\n");

  const transporter = nodemailer.createTransport({
    host: "smtppro.zoho.eu",
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.sendMail({
      from: smtpUser,
      to: email,
      replyTo: "privacy@nothingweird.agency",
      subject,
      text,
    });
  } catch (err) {
    console.error("[delete-account] sendMail failed", err);
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
