import { routing } from "@/i18n/routing";

export type DailyStrings = {
  subject: string;
  preheader: string;
  greeting: string;
  greetingAnon: string;
  cta: string;
  ctaFallback: string;
  footerNote: string;
  unsubscribe: string;
  cards: Record<string, string>;
};

/**
 * Daily-card copy for one locale.
 *
 * Imported directly rather than through next-intl: this is read by a cron route
 * and the mailer, where the hooks don't exist — the same approach
 * `getResetEmailStrings` already takes.
 *
 * `messages/{locale}/daily.json` is deliberately NOT registered in
 * `src/i18n/request.ts`: nothing in the app UI reads it, and registering it would
 * ship 78 strings into every page bundle. Register it only if a "card of the day"
 * surface is ever added on-site.
 */
export async function getDailyStrings(locale: string): Promise<DailyStrings> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${safe}/daily.json`)).default;
  return messages.daily as DailyStrings;
}

/** Card display names, same locale-safe import. */
export async function getCardNames(
  locale: string
): Promise<Record<string, string>> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${safe}/cards.json`)).default;
  return messages.cards as Record<string, string>;
}

/** Reader display names, for the CTA line. */
export async function getReaderName(
  locale: string,
  readerId: string
): Promise<string | null> {
  const safe = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const messages = (await import(`../../messages/${safe}/readings.json`)).default;
  const block = messages.readings?.readers?.[readerId];
  return (block?.displayName as string | undefined) ?? null;
}
