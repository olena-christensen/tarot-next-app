import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";
import { routing } from "@/i18n/routing";
import { tarots } from "@/data";
import { DEFAULT_DECK, getCardImagePath } from "@/lib/decks";
import {
  CARD_MEANINGS,
  PAPUS_SOURCE,
  getAdjacentCards,
  getCardMeaning,
} from "@/lib/cardMeanings";
import {
  CARD_CONTENT_LOCALES,
  HREFLANG_MAP,
  absoluteUrl,
  buildAlternates,
  isCardContentLocale,
  localizedPath,
} from "@/lib/seo";
import { CardShareButton } from "./CardShareButton";

type Props = {
  params: { locale: string; slug: string };
};

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

/** Meta descriptions get the first sentence of the upright reading, capped. */
function firstSentence(text: string, max = 200): string {
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    CARD_MEANINGS.map((card) => ({ locale, slug: card.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = getCardMeaning(params.slug);
  if (!card) return { robots: { index: false, follow: false } };

  const { locale } = params;
  const path = `/cards/${card.slug}`;
  const url = absoluteUrl(localizedPath(locale, path));
  const image = absoluteUrl(getCardImagePath(DEFAULT_DECK, CARD_IMAGES[card.id]));
  const title = `${card.title} — Tarot Card Meaning`;
  const description = firstSentence(card.upright);
  const indexed = isCardContentLocale(locale);

  return {
    title,
    description,
    ...(indexed ? {} : { robots: { index: false, follow: true } }),
    alternates: indexed
      ? buildAlternates({ locale, path, translatedLocales: CARD_CONTENT_LOCALES })
      : { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: [{ url: image, width: 600, height: 1050, alt: card.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CardPage({ params }: Props) {
  const card = getCardMeaning(params.slug);
  if (!card) notFound();

  unstable_setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "cardMeanings" });

  const { previous, next } = getAdjacentCards(card.slug);
  const path = `/cards/${card.slug}`;
  const url = absoluteUrl(localizedPath(params.locale, path));
  const image = getCardImagePath(DEFAULT_DECK, CARD_IMAGES[card.id]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${card.title} — Tarot Card Meaning`,
        description: firstSentence(card.upright),
        url,
        image: absoluteUrl(image),
        inLanguage: HREFLANG_MAP.en,
        isBasedOn: {
          "@type": "Book",
          name: PAPUS_SOURCE.title,
          author: { "@type": "Person", name: PAPUS_SOURCE.author },
          translator: { "@type": "Person", name: PAPUS_SOURCE.translator },
          datePublished: PAPUS_SOURCE.translationYear,
        },
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
            item: absoluteUrl(localizedPath(params.locale, "/cards")),
          },
          { "@type": "ListItem", position: 3, name: card.title, item: url },
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
      <main className="card-page container">
        <article className="card-page__panel">
          <header className="card-page__header">
            <Image
              className="card-page__img"
              src={image}
              alt={card.title}
              // Intrinsic ratio of the source art (854×1500). Rendered at 180px
              // (240 from `md`), so a DPR-3 phone needs ~540px — `sizes` is what
              // lets the browser ask for that instead of the 256px candidate a
              // bare width={240} would cap it at.
              width={427}
              height={750}
              sizes="(min-width: 768px) 240px, 180px"
              quality={90}
              priority
            />
            <div className="card-page__heading">
              <h1 className="card-page__title title">{card.title}</h1>
              <p className="card-page__kicker">
                {card.arcanum === "major"
                  ? t("groupMajor")
                  : t(
                      card.suit === "wands"
                        ? "groupWands"
                        : card.suit === "chalices"
                          ? "groupChalices"
                          : card.suit === "swords"
                            ? "groupSwords"
                            : "groupPentacles"
                    )}
              </p>
              <CardShareButton url={url} cardTitle={card.title} />
            </div>
          </header>

          {card.derivation && (
            <section className="card-page__section card-page__section--derivation">
              <h2 className="card-page__section-title">{t("derivation")}</h2>
              <p className="card-page__text">{card.derivation}</p>
            </section>
          )}

          <section className="card-page__section">
            <h2 className="card-page__section-title">{t("upright")}</h2>
            <p className="card-page__text">{card.upright}</p>
          </section>

          <section className="card-page__section">
            <h2 className="card-page__section-title">{t("reversed")}</h2>
            <p className="card-page__text">{card.reversed}</p>
          </section>

          <section className="card-page__section">
            <h2 className="card-page__section-title">{t("correspondences")}</h2>
            <dl className="card-page__correspondences">
              {card.correspondences.map((row) => (
                <div className="card-page__correspondence" key={row.label}>
                  <dt className="card-page__correspondence-label">{row.label}</dt>
                  <dd className="card-page__correspondence-value">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card-page__section">
            <h2 className="card-page__section-title">{t("inSpread")}</h2>
            <p className="card-page__text">{card.inSpread}</p>
          </section>

          <aside className="card-page__source">
            <h2 className="card-page__source-title">{t("sourceHeading")}</h2>
            <p className="card-page__source-lead">{t("sourceLead")}</p>
            <p className="card-page__citation">{PAPUS_SOURCE.citation}</p>
          </aside>
        </article>

        <nav className="card-page__pager" aria-label={t("indexTitle")}>
          {previous ? (
            <Link className="card-page__pager-link" href={`/cards/${previous.slug}`}>
              <span className="card-page__pager-label">{t("previousCard")}</span>
              <span className="card-page__pager-name">{previous.title}</span>
            </Link>
          ) : (
            // Placeholder so the middle link stays centred on the first and
            // last cards, where one of the two arrows is missing.
            <span />
          )}

          <Link className="card-page__pager-all" href="/cards">
            {t("backToIndex")}
          </Link>

          {next ? (
            <Link
              className="card-page__pager-link card-page__pager-link--next"
              href={`/cards/${next.slug}`}
            >
              <span className="card-page__pager-label">{t("nextCard")}</span>
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
