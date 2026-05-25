import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// TODO: add rate limiting (per-IP token bucket or Upstash) — currently unprotected beyond the honeypot.

const CATEGORIES = [
  "general",
  "dsar_access",
  "dsar_delete",
  "dsar_correct",
  "legal_ip",
  "other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_TO: Record<Category, string> = {
  dsar_access: "privacy@nothingweird.agency",
  dsar_delete: "privacy@nothingweird.agency",
  dsar_correct: "privacy@nothingweird.agency",
  legal_ip: "legal@nothingweird.agency",
  general: "support@nothingweird.agency",
  other: "support@nothingweird.agency",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isString = (v: unknown): v is string => typeof v === "string";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;

  if (isString(body.website) && body.website.trim() !== "") {
    console.warn("[contact] honeypot triggered", {
      email: isString(body.email) ? body.email : undefined,
    });
    return NextResponse.json({ ok: true });
  }

  const name = isString(body.name) ? body.name.trim() : "";
  const email = isString(body.email) ? body.email.trim() : "";
  const category = isString(body.category) ? body.category : "";
  const message = isString(body.message) ? body.message.trim() : "";
  const locale = isString(body.locale) ? body.locale : "en";

  if (!name || name.length > 100) {
    return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }
  if (!CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ ok: false, error: "Invalid category" }, { status: 400 });
  }
  if (!message || message.length < 10 || message.length > 5000) {
    return NextResponse.json({ ok: false, error: "Invalid message" }, { status: 400 });
  }

  const smtpUser = process.env.ZOHO_SMTP_USER;
  const smtpPass = process.env.ZOHO_SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error("[contact] missing ZOHO_SMTP_USER or ZOHO_SMTP_PASS");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const to = CATEGORY_TO[category as Category];
  const timestamp = new Date().toISOString();
  const subject = `[theveil:${category}] ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Category: ${category}`,
    `Locale: ${locale}`,
    `Received (UTC): ${timestamp}`,
    "",
    "Message:",
    message,
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
      to,
      replyTo: email,
      subject,
      text,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] sendMail failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
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
