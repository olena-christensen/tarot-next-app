"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { tarots } from "@/data";
import { getCardImagePath, DEFAULT_DECK } from "@/lib/decks";
import { SubscriptionModal } from "@/components/SubscriptionModal";

type Reading = {
  id: string;
  cards: string[];
  response: string;
  createdAt: string;
};

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

export const ReadingHistory = () => {
  const { data: session } = useSession();
  const t = useTranslations("history");
  const tCards = useTranslations("cards");
  const locale = useLocale();

  const [readings, setReadings] = useState<Reading[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState("");
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const deck = session?.user?.preferredDeck ?? DEFAULT_DECK;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const load = useCallback(async (cursor: string | null) => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const res = await fetch(`/api/readings${query}`);
    if (res.status === 403) {
      setIsLocked(true);
      return;
    }
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    setReadings((prev) =>
      cursor ? [...prev, ...(data.readings as Reading[])] : (data.readings as Reading[])
    );
    setNextCursor(data.nextCursor ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load(null);
      } catch {
        if (!cancelled) setError(t("error"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, t]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setError("");
    try {
      await load(nextCursor);
    } catch {
      setError(t("error"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return <p className="reading-history__status">{t("loading")}</p>;
  }

  if (isLocked) {
    return (
      <div className="reading-history__locked">
        <h2 className="reading-history__locked-title">{t("lockedTitle")}</h2>
        <p className="reading-history__locked-body">{t("lockedBody")}</p>
        <button
          type="button"
          className="btn reading-history__locked-cta"
          onClick={() => setIsSubscriptionOpen(true)}
        >
          {t("lockedCta")}
        </button>
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
        />
      </div>
    );
  }

  if (error && readings.length === 0) {
    return <p className="reading-history__status">{error}</p>;
  }

  if (readings.length === 0) {
    return <p className="reading-history__status">{t("empty")}</p>;
  }

  return (
    <div className="reading-history">
      <ol className="reading-history__list list">
        {readings.map((reading) => (
          <li key={reading.id} className="reading-history__entry">
            <time
              className="reading-history__date"
              dateTime={reading.createdAt}
            >
              {dateFormatter.format(new Date(reading.createdAt))}
            </time>
            <div className="reading-history__cards">
              {reading.cards.map((cardId, index) => {
                const image = CARD_IMAGES[cardId];
                return (
                  <figure
                    key={`${reading.id}-${cardId}-${index}`}
                    className="reading-history__card"
                  >
                    {image && (
                      <Image
                        className="reading-history__card-img"
                        src={getCardImagePath(deck, image)}
                        alt=""
                        width={80}
                        height={140}
                      />
                    )}
                    <figcaption className="reading-history__card-name">
                      {tCards(cardId)}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            <p className="reading-history__text">{reading.response}</p>
          </li>
        ))}
      </ol>
      {error && <p className="reading-history__status">{error}</p>}
      {nextCursor && (
        <button
          type="button"
          className="btn reading-history__more"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? t("loading") : t("loadMore")}
        </button>
      )}
    </div>
  );
};
