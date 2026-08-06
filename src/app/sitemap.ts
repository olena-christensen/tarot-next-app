import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  CARD_CONTENT_LOCALES,
  GLOBAL_ROUTES,
  HREFLANG_MAP,
  PUBLIC_ROUTES,
  absoluteUrl,
  localizedPath,
} from "@/lib/seo";
import { CARDS_IN_READING_ORDER } from "@/lib/cardMeanings";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const localized = PUBLIC_ROUTES.flatMap((route) =>
    routing.locales.map((locale) => {
      const languages: Record<string, string> = {};
      for (const loc of routing.locales) {
        const hreflang = HREFLANG_MAP[loc] ?? loc;
        languages[hreflang] = absoluteUrl(localizedPath(loc, route));
      }
      languages["x-default"] = absoluteUrl(localizedPath(routing.defaultLocale, route));

      return {
        url: absoluteUrl(localizedPath(locale, route)),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1 : 0.7,
        alternates: { languages },
      };
    }),
  );

  const global = GLOBAL_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  // Card meanings are English-only for now, so only the locales that actually
  // have the words are listed — the other four are noindex and submitting them
  // would just ask a crawler to index the same English page five times.
  const cards = CARD_CONTENT_LOCALES.flatMap((locale) => [
    {
      url: absoluteUrl(localizedPath(locale, "/cards")),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...CARDS_IN_READING_ORDER.map((card) => ({
      url: absoluteUrl(localizedPath(locale, `/cards/${card.slug}`)),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ]);

  return [...localized, ...cards, ...global];
}
