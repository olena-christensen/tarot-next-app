import crypto from "crypto";
import { routing } from "@/i18n/routing";

/** How long an emailed reset link stays valid. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Minimum gap between two reset emails for the same account. */
export const RESET_THROTTLE_MS = 60 * 1000;

/** Raw token handed to the user (URL-safe); never stored. */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** What we persist — a leaked DB row can't be turned back into a usable link. */
export function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

type EmailStrings = {
  resetEmailSubject: string;
  resetEmailIntro: string;
  resetEmailCta: string;
  resetEmailExpiry: string;
  resetEmailIgnore: string;
};

/**
 * Loads the reset-email copy in the recipient's own language. Reads the message
 * JSON directly — next-intl's hooks are request/client-scoped and unavailable
 * in a route handler sending mail.
 */
export async function getResetEmailStrings(
  locale: string
): Promise<EmailStrings> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${safe}/ui.json`)).default;
  return messages.ui as EmailStrings;
}
