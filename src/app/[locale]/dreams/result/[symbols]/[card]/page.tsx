import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";
import { DreamShareButton } from "@/components/DreamShareButton";
import { tarots } from "@/data";
import { DEFAULT_DECK, getCardImagePath } from "@/lib/decks";
import { getCardMeaning } from "@/lib/cardMeanings";
import { cardTextFor } from "@/lib/cardTranslations";
import { parseSymbolCode } from "@/lib/dreamMeanings";
import { localizeDream } from "@/lib/dreamTranslations";
import { firstSentence, symbolsLabel } from "@/lib/dreamResult";
import { absoluteUrl, localizedPath } from "@/lib/seo";

type Props = {
  params: { locale: string; symbols: string; card: string };
};

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dreams = parseSymbolCode(params.symbols)?.map((d) => localizeDream(d, params.locale));
  const card = getCardMeaning(params.card);
  // A result is a personal page, never something for search results.
  if (!dreams || !card) return { robots: { index: false, follow: false } };

  const t = await getTranslations({ locale: params.locale, namespace: "dreams" });
  const title = t("resultMetaTitle", { symbols: symbolsLabel(dreams, params.locale).toLowerCase() });
  const description = t("resultMetaDescription");

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { type: "article", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DreamResultPage({ params }: Props) {
  const dreams = parseSymbolCode(params.symbols)?.map((d) => localizeDream(d, params.locale));
  const card = getCardMeaning(params.card);
  if (!dreams || !card) notFound();

  unstable_setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "dreams" });
  const tCards = await getTranslations({ locale: params.locale, namespace: "cards" });

  const cardName = params.locale === "en" ? card.title : tCards(card.id);
  const text = cardTextFor(card, params.locale) ?? card;
  const label = symbolsLabel(dreams, params.locale);
  const image = getCardImagePath(DEFAULT_DECK, CARD_IMAGES[card.id]);
  const shareUrl = absoluteUrl(
    localizedPath(params.locale, `/dreams/result/${params.symbols}/${card.slug}`)
  );

  return (
    <PageShell>
      <main className="dream-result container">
        <div className="dream-result__card">
          <Image
            className="dream-result__img"
            src={image}
            alt={cardName}
            width={427}
            height={750}
            sizes="(min-width: 768px) 260px, 200px"
            quality={90}
            priority
          />
        </div>

        <div className="dream-result__body">
          <p className="card-page__kicker">{t("resultKicker")}</p>
          <h1 className="dream-result__title title">{label}</h1>

          {dreams.map((dream) => (
            <section className="dream-result__symbol" key={dream.slug}>
              <h2 className="card-page__section-title">{dream.title}</h2>
              <p className="card-page__text">{dream.short}</p>
              <Link className="dream-result__link" href={`/dreams/${dream.slug}`}>
                {t("readFull", { name: dream.title.toLocaleLowerCase(params.locale) })}
              </Link>
            </section>
          ))}

          <section className="dream-result__draw">
            <p className="card-page__kicker">{t("cardKicker")}</p>
            <h2 className="dream-result__card-name">{cardName}</h2>
            <p className="card-page__text">{firstSentence(text.upright)}</p>
            <Link className="dream-result__link" href={`/cards/${card.slug}`}>
              {t("readCard", { card: cardName })}
            </Link>
          </section>

          <div className="dream-result__actions">
            <DreamShareButton url={shareUrl} shareTitle={label} className="dream-glow" label={t("shareDream")} />
            <Link className="dream-result__again" href="/dreams/tell">
              {t("dreamAgain")}
            </Link>
          </div>

          <p className="dream-result__more">
            {t("moreLead")} <Link href="/">{t("moreLink")}</Link> {t("moreTail")}
          </p>
        </div>
      </main>
    </PageShell>
  );
}
