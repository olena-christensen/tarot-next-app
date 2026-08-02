"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { tarots } from "@/data";
import { getCardImagePath, DEFAULT_DECK } from "@/lib/decks";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { Modal } from "@/components/Modal";
import EditIcon from "@/assets/svg/edit.svg";
import TrashIcon from "@/assets/svg/trash.svg";

const MAX_TITLE_LENGTH = 80;

type Reading = {
  id: string;
  cards: string[];
  response: string;
  title: string | null;
  createdAt: string;
};

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

export const ReadingHistory = () => {
  const { data: session } = useSession();
  const t = useTranslations("history");
  const tUi = useTranslations("ui");
  const tCards = useTranslations("cards");
  const locale = useLocale();

  const [readings, setReadings] = useState<Reading[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState("");
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const [renaming, setRenaming] = useState<Reading | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const [deleting, setDeleting] = useState<Reading | null>(null);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deck = session?.user?.preferredDeck ?? DEFAULT_DECK;

  // Date + time — two readings on the same day need to be tellable apart.
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

  const handleOpenRename = (reading: Reading) => {
    setTitleInput(reading.title ?? "");
    setError("");
    setRenaming(reading);
  };

  const handleSaveTitle = async () => {
    if (!renaming || isSavingTitle) return;
    setIsSavingTitle(true);
    setError("");
    try {
      const res = await fetch(`/api/readings/${renaming.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput }),
      });
      if (!res.ok) throw new Error("failed");
      const { title } = await res.json();
      setReadings((prev) =>
        prev.map((r) => (r.id === renaming.id ? { ...r, title } : r))
      );
      setRenaming(null);
    } catch {
      setError(t("saveError"));
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDeleteOne = async () => {
    if (!deleting || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/readings/${deleting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      setReadings((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    } catch {
      setError(t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurge = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/readings", { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setReadings([]);
      setNextCursor(null);
      setIsPurgeOpen(false);
    } catch {
      setError(t("deleteError"));
    } finally {
      setIsDeleting(false);
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
    return (
      <div className="reading-history__empty">
        <p className="reading-history__status">{t("empty")}</p>
        <Link href="/" className="btn reading-history__empty-cta">
          {t("emptyCta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="reading-history">
      <ol className="reading-history__list list">
        {readings.map((reading) => (
          <li key={reading.id} className="reading-history__entry">
            <div className="reading-history__entry-head">
              <div className="reading-history__heading">
                {reading.title && (
                  <h2 className="reading-history__name">{reading.title}</h2>
                )}
                <time
                  className="reading-history__date"
                  dateTime={reading.createdAt}
                >
                  {dateTimeFormatter.format(new Date(reading.createdAt))}
                </time>
              </div>
              <div className="reading-history__entry-actions">
                <button
                  type="button"
                  className="reading-history__action"
                  onClick={() => handleOpenRename(reading)}
                  aria-label={t("rename")}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="reading-history__action"
                  onClick={() => setDeleting(reading)}
                  aria-label={t("deleteEntry")}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
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
      <button
        type="button"
        className="reading-history__purge"
        onClick={() => setIsPurgeOpen(true)}
      >
        {t("deleteAll")}
      </button>

      <Modal
        isOpen={renaming !== null}
        onClose={() => setRenaming(null)}
        title={t("rename")}
      >
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveTitle();
          }}
        >
          <div className="form__input-block">
            <label htmlFor="reading-title" className="form__label">
              {t("renameLabel")}
            </label>
            <input
              id="reading-title"
              className="form__input"
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              autoFocus
              disabled={isSavingTitle}
            />
          </div>
          <div className="form__input-block">
            <button type="submit" className="btn form__btn" disabled={isSavingTitle}>
              {isSavingTitle ? tUi("saving") : tUi("save")}
            </button>
            <button
              type="button"
              className="btn form__btn form__btn--google"
              onClick={() => setRenaming(null)}
              disabled={isSavingTitle}
            >
              {tUi("cancel")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("deleteEntry")}
      >
        <div className="reading-history__confirm">
          <p className="reading-history__confirm-body">
            {t("deleteEntryConfirm")}
          </p>
          <div className="reading-history__confirm-actions">
            <button
              type="button"
              className="btn form__btn form__btn--google"
              onClick={() => setDeleting(null)}
              disabled={isDeleting}
            >
              {tUi("cancel")}
            </button>
            <button
              type="button"
              className="btn form__btn reading-history__confirm-danger"
              onClick={handleDeleteOne}
              disabled={isDeleting}
            >
              {isDeleting ? t("deleting") : t("confirmDelete")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPurgeOpen}
        onClose={() => setIsPurgeOpen(false)}
        title={t("deleteAll")}
      >
        <div className="reading-history__confirm">
          <p className="reading-history__confirm-body">
            {t("deleteAllConfirm")}
          </p>
          <div className="reading-history__confirm-actions">
            <button
              type="button"
              className="btn form__btn form__btn--google"
              onClick={() => setIsPurgeOpen(false)}
              disabled={isDeleting}
            >
              {tUi("cancel")}
            </button>
            <button
              type="button"
              className="btn form__btn reading-history__confirm-danger"
              onClick={handlePurge}
              disabled={isDeleting}
            >
              {isDeleting ? t("deleting") : t("confirmDeleteAll")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
