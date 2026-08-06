import { routing } from "@/i18n/routing";

const FALLBACK_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_SITE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export const HREFLANG_MAP: Record<string, string> = {
  en: "en",
  no: "nb-NO",
  uk: "uk-UA",
  tr: "tr-TR",
  ru: "ru-RU",
};

export const PUBLIC_ROUTES = ["", "/decks", "/subscription"] as const;
export const GLOBAL_ROUTES = ["/privacy", "/terms"] as const;

/**
 * Locales with real content in /cards. The routes are generated for every
 * locale so middleware never 404s, but only these are indexed, sitemapped or
 * pointed at by an hreflang. Add a locale here the day its translations land.
 */
export const CARD_CONTENT_LOCALES = ["en"] as const;

export function isCardContentLocale(locale: string): boolean {
  return (CARD_CONTENT_LOCALES as readonly string[]).includes(locale);
}

export function localizedPath(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  return `/${locale}${clean}`;
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

type AlternatesInput = {
  locale: string;
  path: string;
  /**
   * Which locales actually have content at this path. Defaults to all of them.
   * An hreflang pointing at a locale that only renders English is a lie to the
   * crawler, so a partly-translated section passes the subset it really has —
   * see /cards, which is English-only for now.
   */
  translatedLocales?: readonly string[];
};

export function buildAlternates({ locale, path, translatedLocales }: AlternatesInput) {
  const locales = translatedLocales ?? routing.locales;
  const defaultLocale = locales.includes(routing.defaultLocale)
    ? routing.defaultLocale
    : locales[0];
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    const hreflang = HREFLANG_MAP[loc] ?? loc;
    languages[hreflang] = absoluteUrl(localizedPath(loc, path));
  }
  languages["x-default"] = absoluteUrl(localizedPath(defaultLocale, path));
  return {
    canonical: absoluteUrl(localizedPath(locale, path)),
    languages,
  };
}

type JsonLdInput = {
  locale: string;
  siteName: string;
  description: string;
};

export function buildJsonLd({ locale, siteName, description }: JsonLdInput) {
  const siteUrl = getSiteUrl();
  const orgId = `${siteUrl}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: siteName,
        url: siteUrl,
        logo: absoluteUrl("/logo-2.png"),
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        name: siteName,
        url: absoluteUrl(localizedPath(locale, "/")),
        description,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: HREFLANG_MAP[locale] ?? locale,
        image: absoluteUrl("/og-image.png"),
        publisher: { "@id": orgId },
      },
    ],
  };
}
