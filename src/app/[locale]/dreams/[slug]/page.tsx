import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";
import { DreamShareButton } from "@/components/DreamShareButton";
import { routing } from "@/i18n/routing";
import { DREAMS, getDream } from "@/lib/dreamMeanings";
import { getAdjacentLocalized, localizeDream } from "@/lib/dreamTranslations";
import {
  DREAM_CONTENT_LOCALES,
  HREFLANG_MAP,
  absoluteUrl,
  buildAlternates,
  isDreamContentLocale,
  localizedPath,
} from "@/lib/seo";
import DreamMoon from "@/assets/svg/dream-moon.svg";

type Props = {
  params: { locale: string; slug: string };
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => DREAMS.map((dream) => ({ locale, slug: dream.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const base = getDream(params.slug);
  if (!base) return { robots: { index: false, follow: false } };

  const { locale } = params;
  const dream = localizeDream(base, locale);
  const path = `/dreams/${dream.slug}`;
  const url = absoluteUrl(localizedPath(locale, path));
  const t = await getTranslations({ locale, namespace: "dreams" });
  const title = t("dreamMetaTitle", { name: dream.title });
  const description = dream.short;
  const indexed = isDreamContentLocale(locale);

  return {
    title,
    description,
    ...(indexed ? {} : { robots: { index: false, follow: true } }),
    alternates: indexed
      ? buildAlternates({ locale, path, translatedLocales: DREAM_CONTENT_LOCALES })
      : { canonical: url },
    openGraph: { type: "article", title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DreamPage({ params }: Props) {
  const base = getDream(params.slug);
  if (!base) notFound();

  unstable_setRequestLocale(params.locale);
  const dream = localizeDream(base, params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "dreams" });
  const { previous, next } = getAdjacentLocalized(dream.slug, params.locale);
  const url = absoluteUrl(localizedPath(params.locale, `/dreams/${dream.slug}`));
  const title = t("dreamMetaTitle", { name: dream.title });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description: dream.short,
        url,
        inLanguage: HREFLANG_MAP[params.locale] ?? "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "The Veil",
            item: absoluteUrl(localizedPath(params.locale, "/")),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t("indexTitle"),
            item: absoluteUrl(localizedPath(params.locale, "/dreams")),
          },
          { "@type": "ListItem", position: 3, name: dream.title, item: url },
        ],
      },
    ],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        // Serialised from a literal built above — no user input reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="dream-page card-page container">
        <article className="card-page__panel dream-page__panel">
          <header className="dream-page__header">
            <DreamMoon className="dream-page__moon" aria-hidden="true" />
            <p className="card-page__kicker">{t("kicker")}</p>
            <h1 className="card-page__title title">{dream.title}</h1>
            <DreamShareButton url={url} shareTitle={title} className="card-page__share" />
            {!isDreamContentLocale(params.locale) && (
              <p className="dreams-index__note">{t("englishOnly")}</p>
            )}
          </header>

          <section className="card-page__section">
            <h2 className="card-page__section-title">{t("whatItMeans")}</h2>
            {dream.paragraphs.map((paragraph) => (
              <p className="card-page__text dream-page__text" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>

          <section className="dream-page__cta">
            <h2 className="dream-page__cta-title">{t("ctaTitle")}</h2>
            <p className="dream-page__cta-lead">{t("ctaLead")}</p>
            <Link className="dream-glow" href="/">
              {t("ctaDraw")}
            </Link>
            <Link className="dream-page__cta-link" href="/dreams/tell">
              {t("ctaTell")}
            </Link>
          </section>

          <aside className="card-page__source">
            <h2 className="card-page__source-title">{t("sourceHeading")}</h2>
            <p className="card-page__source-lead">{t("sourceLead")}</p>
          </aside>
        </article>

        <nav className="card-page__pager" aria-label={t("indexTitle")}>
          {previous ? (
            <Link className="card-page__pager-link" href={`/dreams/${previous.slug}`}>
              <span className="card-page__pager-label">{t("previous")}</span>
              <span className="card-page__pager-name">{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          <Link className="card-page__pager-all" href="/dreams">
            {t("allDreams")}
          </Link>
          {next ? (
            <Link
              className="card-page__pager-link card-page__pager-link--next"
              href={`/dreams/${next.slug}`}
            >
              <span className="card-page__pager-label">{t("next")}</span>
              <span className="card-page__pager-name">{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </PageShell>
  );
}
