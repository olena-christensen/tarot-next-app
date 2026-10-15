import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";
import { DreamIndexSearch } from "@/components/DreamIndexSearch";
import { routing } from "@/i18n/routing";
import { DREAMS, DREAM_SOURCE } from "@/lib/dreamMeanings";
import { getLocalizedDreams, groupLocalizedByLetter } from "@/lib/dreamTranslations";
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
  const title = t("metaTitle");
  const description = t("metaDescription", { count: DREAMS.length });
  const indexed = isDreamContentLocale(locale);

  return {
    title,
    description,
    ...(indexed ? {} : { robots: { index: false, follow: true } }),
    alternates: indexed
      ? buildAlternates({ locale, path: "/dreams", translatedLocales: DREAM_CONTENT_LOCALES })
      : { canonical: absoluteUrl(localizedPath(locale, "/dreams")) },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(localizedPath(locale, "/dreams")),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DreamsIndexPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "dreams" });
  const groups = groupLocalizedByLetter(params.locale);
  const index = getLocalizedDreams(params.locale).map(({ slug, title, terms }) => ({
    slug,
    title,
    terms,
  }));

  return (
    <PageShell>
      <main className="dreams-index container">
        <DreamMoon className="dreams-index__moon" aria-hidden="true" />
        <h1 className="dreams-index__title title">{t("indexTitle")}</h1>
        <p className="dreams-index__lead">
          {t("indexLead")} <Link href="/dreams/tell">{t("tellLink")}</Link>.
        </p>
        {!isDreamContentLocale(params.locale) && (
          <p className="dreams-index__note">{t("englishOnly")}</p>
        )}

        <DreamIndexSearch index={index}>
          <nav className="dreams-index__letters" aria-label={t("indexTitle")}>
            {groups.map(({ letter }) => (
              <a key={letter} className="dreams-index__letter" href={`#letter-${letter}`}>
                {letter}
              </a>
            ))}
          </nav>
          {groups.map(({ letter, dreams }) => (
            <section className="dreams-index__group" key={letter} id={`letter-${letter}`}>
              <h2 className="dreams-index__group-title">{letter}</h2>
              <ul className="dreams-index__list">
                {dreams.map((dream) => (
                  <li key={dream.slug}>
                    <Link className="dreams-index__link" href={`/dreams/${dream.slug}`}>
                      {dream.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </DreamIndexSearch>

        <aside className="cards-index__source">
          <p className="cards-index__source-lead">{t("sourceLead")}</p>
          <p className="cards-index__citation">
            {DREAM_SOURCE.author}, {DREAM_SOURCE.title} ({DREAM_SOURCE.year})
          </p>
        </aside>
      </main>
    </PageShell>
  );
}
