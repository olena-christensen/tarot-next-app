import crypto from "crypto";
import { routing } from "@/i18n/routing";
import { prisma } from "./prisma";

/**
 * Email verification.
 *
 * The rule, decided 2026-08-04: an unverified address blocks **checkout only**.
 * Reading tarot doesn't need a verified address; taking someone's €5 when the
 * receipt and every password-reset would bounce does. Nobody is stopped at the
 * door, which is where verification walls usually lose people.
 */

/** How long an emailed verification link stays valid. Longer than a password
 *  reset (1h) — this one is not a security-sensitive grant, and a link that dies
 *  before someone checks their inbox just generates support mail. */
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum gap between two verification emails for the same account. */
export const VERIFY_THROTTLE_MS = 60 * 1000;

/** Raw token handed to the user (URL-safe); never stored. */
export function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** What we persist — a leaked DB row can't be turned back into a usable link. */
export function hashVerifyToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export type VerifyEmailStrings = {
  verifyEmailSubject: string;
  verifyEmailIntro: string;
  verifyEmailCta: string;
  verifyEmailExpiry: string;
  verifyEmailIgnore: string;
};

/**
 * Verification-email copy in the recipient's own language. Reads the message
 * JSON directly — next-intl's hooks are request/client-scoped and unavailable
 * in a route handler sending mail.
 */
export async function getVerifyEmailStrings(
  locale: string
): Promise<VerifyEmailStrings> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${safe}/ui.json`)).default;
  return messages.ui as VerifyEmailStrings;
}

/**
 * Mint a fresh verification link for a user, replacing any earlier one.
 *
 * Returns null when the throttle says a link was already sent moments ago —
 * the caller should still answer as though it succeeded, so repeated clicking
 * can't be used to probe anything.
 */
export async function issueVerificationToken(
  userId: string,
  now: Date = new Date()
): Promise<string | null> {
  const newest = await prisma.emailVerificationToken.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (
    newest &&
    now.getTime() - newest.createdAt.getTime() < VERIFY_THROTTLE_MS
  ) {
    return null;
  }

  const raw = generateVerifyToken();
  // One live link per account: an old one lingering is a second key to the
  // same door for no benefit.
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashVerifyToken(raw),
        expiresAt: new Date(now.getTime() + VERIFY_TOKEN_TTL_MS),
      },
    }),
  ]);
  return raw;
}
