import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { tarots } from "@/data";
import { getCardImagePath, DEFAULT_DECK } from "@/lib/decks";
import { READER_IDS, type ReaderId } from "@/lib/readers";
import { absoluteUrl, localizedPath } from "@/lib/seo";
import { PublicReadingFooter } from "./PublicReadingFooter";

type Props = {
  params: { locale: string; shareId: string };
};

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

/**
 * A reading its owner chose to publish. No account needed, and deliberately
 * anonymous — cards, words and reader only, never who drew it.
 */
async function getShared(shareId: string) {
  return prisma.reading.findUnique({
    where: { shareId },
    select: {
      cards: true,
      response: true,
      title: true,
      readerId: true,
      deckId: true,
      createdAt: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const reading = await getShared(params.shareId);
  const t = await getTranslations({ locale: params.locale, namespace: "history" });
  if (!reading) return { title: t("sharedMissingTitle"), robots: { index: false, follow: false } };

  const title = reading.title || t("sharedTitle");
  // First sentence only — enough to intrigue in a social preview without
  // spilling the whole reading before the click.
  const description = reading.response.split(/(?<=[.!?])\s/)[0]?.slice(0, 200) ?? "";
  const url = absoluteUrl(localizedPath(params.locale, `/r/${params.shareId}`));

  return {
    title,
    description,
    // Personal content, and thousands of thin auto-generated pages would drag
    // the site's SEO down rather than lift it.
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedReadingPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  const reading = await getShared(params.shareId);
  if (!reading) notFound();

  const t = await getTranslations({ locale: params.locale, namespace: "history" });
  const tCards = await getTranslations({ locale: params.locale, namespace: "cards" });
  const tReaders = await getTranslations({ locale: params.locale, namespace: "readers" });

  const deck = reading.deckId ?? DEFAULT_DECK;
  const hasReader =
    reading.readerId && READER_IDS.includes(reading.readerId as ReaderId);
  const date = new Intl.DateTimeFormat(params.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(reading.createdAt);

  return (
    <main className="shared-reading container">
      <article className="shared-reading__panel">
        <h1 className="shared-reading__title title">
          {reading.title || t("sharedTitle")}
        </h1>
        <p className="shared-reading__meta">
          <time dateTime={reading.createdAt.toISOString()}>{date}</time>
          {hasReader && (
            <>
              <span aria-hidden="true"> · </span>
              <span className="shared-reading__reader">
                {tReaders(`${reading.readerId}.displayName`)}
              </span>
            </>
          )}
        </p>
        <div className="shared-reading__cards">
          {reading.cards.map((cardId, index) => {
            const image = CARD_IMAGES[cardId];
            return (
              <figure key={`${cardId}-${index}`} className="shared-reading__card">
                {image && (
                  <Image
                    className="shared-reading__card-img"
                    src={getCardImagePath(deck, image)}
                    alt=""
                    width={120}
                    height={210}
                  />
                )}
                <figcaption className="shared-reading__card-name">
                  {tCards(cardId)}
                </figcaption>
              </figure>
            );
          })}
        </div>
        <p className="shared-reading__text">{reading.response}</p>
      </article>
      <PublicReadingFooter />
    </main>
  );
}
