import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { DreamTeller } from "@/components/DreamTeller";
import { routing } from "@/i18n/routing";
import { POPULAR_SLUGS } from "@/lib/dreamMeanings";
import { getLocalizedDreams } from "@/lib/dreamTranslations";
import { CARD_MEANINGS } from "@/lib/cardMeanings";
import {
  DREAM_CONTENT_LOCALES,
  absoluteUrl,
  buildAlternates,
  isDreamContentLocale,
  localizedPath,
} from "@/lib/seo";
import DreamMoon from "@/assets/svg/dream-moon.svg";

type Props = {
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "dreams" });
  const title = t("tellMetaTitle");
  const description = t("tellMetaDescription");
  const indexed = isDreamContentLocale(locale);

  return {
    title,
    description,
    ...(indexed ? {} : { robots: { index: false, follow: true } }),
    alternates: indexed
      ? buildAlternates({ locale, path: "/dreams/tell", translatedLocales: DREAM_CONTENT_LOCALES })
      : { canonical: absoluteUrl(localizedPath(locale, "/dreams/tell")) },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(localizedPath(locale, "/dreams/tell")),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TellDreamPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "dreams" });

  return (
    <PageShell>
      <main className="dream-tell container">
        <DreamMoon className="dreams-index__moon" aria-hidden="true" />
        <p className="card-page__kicker dream-tell__kicker">{t("tellKicker")}</p>
        <h1 className="dream-tell__title title">{t("tellTitle")}</h1>
        <p className="dream-tell__lead">{t("tellLead")}</p>
        <DreamTeller
          dreams={getLocalizedDreams(params.locale).map(({ slug, title, terms }) => ({
            slug,
            title,
            terms,
          }))}
          popular={[...POPULAR_SLUGS]}
          cardSlugs={CARD_MEANINGS.map((card) => card.slug)}
        />
      </main>
    </PageShell>
  );
}
