import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { HREFLANG_MAP, PUBLIC_ROUTES, absoluteUrl, localizedPath } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_ROUTES.flatMap((route) =>
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
}
