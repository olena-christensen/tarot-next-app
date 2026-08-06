import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";
import { routing } from "@/i18n/routing";
import { tarots } from "@/data";
import { DEFAULT_DECK, getCardImagePath } from "@/lib/decks";
import { CARD_GROUPS, PAPUS_SOURCE, buildCardSearchIndex } from "@/lib/cardMeanings";
import { CardSearch } from "@/components/CardSearch";
import ChevronDownIcon from "@/assets/svg/chevron-down.svg";
import {
  CARD_CONTENT_LOCALES,
  absoluteUrl,
  buildAlternates,
  isCardContentLocale,
  localizedPath,
} from "@/lib/seo";

type Props = {
  params: { locale: string };
};

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

const GROUP_LABEL_KEYS = {
  major: "groupMajor",
  wands: "groupWands",
  chalices: "groupChalices",
  swords: "groupSwords",
  pentacles: "groupPentacles",
} as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "cardMeanings" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  const indexed = isCardContentLocale(locale);
  const alternates = buildAlternates({
    locale,
    path: "/cards",
    translatedLocales: CARD_CONTENT_LOCALES,
  });

  return {
    title,
    description,
    // The routes exist in every locale so middleware never 404s, but only the
    // locale that actually has the words in it is offered to a crawler.
    ...(indexed ? {} : { robots: { index: false, follow: true } }),
    alternates: indexed
      ? alternates
      : // Self-canonical: a canonical pointing elsewhere alongside noindex sends
        // a crawler two contradictory instructions.
        { canonical: absoluteUrl(localizedPath(locale, "/cards")) },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(localizedPath(locale, "/cards")),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CardsIndexPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "cardMeanings" });

  // Built here so the client gets slugs, titles and search words — not the four
  // paragraphs of prose each card carries.
  const searchIndex = buildCardSearchIndex().map((entry) => ({
    ...entry,
    image: getCardImagePath(DEFAULT_DECK, CARD_IMAGES[entry.id]),
  }));

  return (
    <PageShell>
      <main className="cards-index container">
        <h1 className="cards-index__title title">{t("indexTitle")}</h1>
        {!isCardContentLocale(params.locale) && (
          <p className="cards-index__note">{t("englishOnly")}</p>
        )}

        <CardSearch index={searchIndex}>
          {/*
            <details>, not a client component: the group collapses with no JS, it
            is keyboard-accessible for free, and — the reason that matters here —
            the links stay in the server-rendered HTML while closed, so a crawler
            still walks all 78. A useState accordion would ship a client boundary
            to achieve exactly the same thing.
          */}
          {CARD_GROUPS.map(({ key, cards }) => (
          <details className="cards-index__group" key={key}>
            <summary className="cards-index__group-summary">
              <h2 className="cards-index__group-title">{t(GROUP_LABEL_KEYS[key])}</h2>
              <ChevronDownIcon className="cards-index__chevron" aria-hidden="true" />
            </summary>
            <ul className="cards-index__list">
              {cards.map((card) => (
                <li className="cards-index__item" key={card.slug}>
                  <Link className="cards-index__link" href={`/cards/${card.slug}`}>
                    <Image
                      className="cards-index__img"
                      src={getCardImagePath(DEFAULT_DECK, CARD_IMAGES[card.id])}
                      alt=""
                      // Intrinsic ratio of the source art (854×1500). `sizes` is
                      // what makes Next emit a full srcset — without it the CSS
                      // stretches a 128px candidate across the cell.
                      width={427}
                      height={750}
                      sizes="(min-width: 900px) 16vw, (min-width: 768px) 23vw, (min-width: 600px) 31vw, 46vw"
                      quality={85}
                    />
                    <span className="cards-index__name">{card.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            </details>
          ))}
        </CardSearch>

        <aside className="cards-index__source">
          <p className="cards-index__source-lead">{t("sourceLead")}</p>
          <p className="cards-index__citation">{PAPUS_SOURCE.citation}</p>
        </aside>
      </main>
    </PageShell>
  );
}
