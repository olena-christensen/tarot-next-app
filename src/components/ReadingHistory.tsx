"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { tarots } from "@/data";
import { getCardImagePath, DEFAULT_DECK } from "@/lib/decks";
import { READER_IDS, type ReaderId } from "@/lib/readers";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { Modal } from "@/components/Modal";
import EditIcon from "@/assets/svg/edit.svg";
import TrashIcon from "@/assets/svg/trash.svg";
import PrintIcon from "@/assets/svg/print.svg";
import StarIcon from "@/assets/svg/star.svg";
import ShareIcon from "@/assets/svg/share.svg";
import CopyIcon from "@/assets/svg/copy.svg";
import XIcon from "@/assets/svg/x.svg";
import FacebookIcon from "@/assets/svg/facebook.svg";
import TelegramIcon from "@/assets/svg/telegram.svg";
import WhatsAppIcon from "@/assets/svg/whatsapp.svg";

const MAX_TITLE_LENGTH = 80;
const MAX_NOTE_LENGTH = 2000;

type Reading = {
  id: string;
  cards: string[];
  response: string;
  title: string | null;
  note: string | null;
  readerId: string | null;
  isFavorite: boolean;
  shareId: string | null;
  createdAt: string;
};

const CARD_IMAGES: Record<string, string> = Object.fromEntries(
  tarots.map((card) => [card.id, card.image])
);

// Plain intent URLs — no third-party SDKs, so no trackers load and nothing
// needs cookie consent. Each pre-fills the link in the network's own composer;
// brand names are the accessible label (they aren't translated).
const SHARE_NETWORKS = [
  {
    id: "x",
    label: "X",
    Icon: XIcon,
    href: (url: string) => `https://x.com/intent/tweet?url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    Icon: FacebookIcon,
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    Icon: TelegramIcon,
    href: (url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    Icon: WhatsAppIcon,
    href: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}`,
  },
] as const;

export const ReadingHistory = () => {
  const { data: session } = useSession();
  const t = useTranslations("history");
  const tUi = useTranslations("ui");
  const tCards = useTranslations("cards");
  const tReaders = useTranslations("readers");
  const locale = useLocale();

  const [readings, setReadings] = useState<Reading[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState("");
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  // One editor for both user-owned text fields — you name a reading to find it
  // and annotate it to remember why, so they belong in the same modal.
  const [renaming, setRenaming] = useState<Reading | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // Resolved after mount — navigator is undefined during SSR, and reading it in
  // render would desync server and client HTML.
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && Boolean(navigator.share));
  }, []);

  // Which entry the print stylesheet should isolate; cleared once the dialog closes.
  const [printingId, setPrintingId] = useState<string | null>(null);

  const [sharing, setSharing] = useState<Reading | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

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

  const load = useCallback(async (cursor: string | null, favorites: boolean) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (favorites) params.set("favorites", "1");
    const query = params.toString() ? `?${params}` : "";
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

  // Re-runs when the favorites filter flips — the server does the filtering so
  // paging stays correct instead of hiding rows from an already-paged list.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        await load(null, favoritesOnly);
      } catch {
        if (!cancelled) setError(t("error"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, t, favoritesOnly]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setError("");
    try {
      await load(nextCursor, favoritesOnly);
    } catch {
      setError(t("error"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleFavorite = async (reading: Reading) => {
    const next = !reading.isFavorite;
    // Optimistic: a star must feel instant. Rolled back if the write fails.
    setReadings((prev) =>
      prev.map((r) => (r.id === reading.id ? { ...r, isFavorite: next } : r))
    );
    try {
      const res = await fetch(`/api/readings/${reading.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) throw new Error("failed");
      // Un-starring while the filter is on: drop it from the visible list.
      if (favoritesOnly && !next) {
        setReadings((prev) => prev.filter((r) => r.id !== reading.id));
      }
    } catch {
      setReadings((prev) =>
        prev.map((r) =>
          r.id === reading.id ? { ...r, isFavorite: reading.isFavorite } : r
        )
      );
      setError(t("saveError"));
    }
  };

  // Mark the entry first, then print on the next tick so the data attribute is in
  // the DOM before the browser snapshots the page. window.print() blocks until the
  // dialog closes, so clearing straight after is safe.
  useEffect(() => {
    if (!printingId) return;
    const id = window.setTimeout(() => {
      window.print();
      setPrintingId(null);
    }, 0);
    return () => window.clearTimeout(id);
  }, [printingId]);

  const buildShareUrl = (shareId: string) =>
    `${window.location.origin}/${locale}/r/${shareId}`;

  const handleOpenShare = async (reading: Reading) => {
    setError("");
    setShareCopied(false);
    setSharing(reading);
    // Already published: reuse the link rather than minting another.
    if (reading.shareId) {
      setShareUrl(buildShareUrl(reading.shareId));
      return;
    }
    setShareUrl("");
    setShareBusy(true);
    try {
      const res = await fetch(`/api/readings/${reading.id}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("failed");
      const { shareId } = await res.json();
      setShareUrl(buildShareUrl(shareId));
      setReadings((prev) =>
        prev.map((r) => (r.id === reading.id ? { ...r, shareId } : r))
      );
    } catch {
      setError(t("shareError"));
      setSharing(null);
    } finally {
      setShareBusy(false);
    }
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      // Icon-only button, so "copied" is a transient highlight rather than a
      // label change — drop it back so the control doesn't look stuck.
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions) — the input is
      // selectable, so the link is still obtainable by hand.
      setShareCopied(false);
    }
  };

  // Native share sheet where it exists (mobile, Safari, Edge); elsewhere the
  // copy button and the per-network links carry it.
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ url: shareUrl, title: t("sharedTitle") });
    } catch {
      // User dismissed the sheet — not an error.
    }
  };

  const handleUnshare = async () => {
    if (!sharing || shareBusy) return;
    setShareBusy(true);
    try {
      const res = await fetch(`/api/readings/${sharing.id}/share`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      setReadings((prev) =>
        prev.map((r) => (r.id === sharing.id ? { ...r, shareId: null } : r))
      );
      setSharing(null);
    } catch {
      setError(t("shareError"));
    } finally {
      setShareBusy(false);
    }
  };

  const handleOpenRename = (reading: Reading) => {
    setTitleInput(reading.title ?? "");
    setNoteInput(reading.note ?? "");
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
        body: JSON.stringify({ title: titleInput, note: noteInput }),
      });
      if (!res.ok) throw new Error("failed");
      const { title, note } = await res.json();
      setReadings((prev) =>
        prev.map((r) => (r.id === renaming.id ? { ...r, title, note } : r))
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
    // An empty *filter* result is a different situation from an empty ledger:
    // offering "draw your first fate" to someone who has readings but no
    // favorites would be nonsense.
    if (favoritesOnly) {
      return (
        <div className="reading-history__empty">
          <p className="reading-history__status">{t("emptyFavorites")}</p>
          <button
            type="button"
            className="btn reading-history__empty-cta"
            onClick={() => setFavoritesOnly(false)}
          >
            {t("showAll")}
          </button>
        </div>
      );
    }
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
    <div
      className="reading-history"
      data-printing={printingId ? "true" : undefined}
    >
      <div className="reading-history__toolbar">
        <button
          type="button"
          className="reading-history__filter"
          data-active={favoritesOnly ? "true" : undefined}
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          <StarIcon />
          {t("favoritesOnly")}
        </button>
      </div>
      <ol className="reading-history__list list">
        {readings.map((reading) => (
          <li
            key={reading.id}
            className="reading-history__entry"
            data-printing={reading.id === printingId ? "true" : undefined}
          >
            <div className="reading-history__entry-head">
              <div className="reading-history__heading">
                {reading.title && (
                  <h2 className="reading-history__name">{reading.title}</h2>
                )}
                <p className="reading-history__meta">
                  <time dateTime={reading.createdAt}>
                    {dateTimeFormatter.format(new Date(reading.createdAt))}
                  </time>
                  {/* Null on readings drawn before the reader was recorded — show
                      nothing rather than guessing a name that may be wrong. */}
                  {reading.readerId && READER_IDS.includes(reading.readerId as ReaderId) && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="reading-history__reader">
                        {tReaders(`${reading.readerId}.displayName`)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="reading-history__entry-actions">
                <button
                  type="button"
                  className="reading-history__action"
                  data-active={reading.isFavorite ? "true" : undefined}
                  onClick={() => handleToggleFavorite(reading)}
                  aria-pressed={reading.isFavorite}
                  aria-label={t("favorite")}
                  title={t("favorite")}
                >
                  <StarIcon />
                </button>
                <button
                  type="button"
                  className="reading-history__action"
                  data-active={reading.shareId ? "true" : undefined}
                  onClick={() => handleOpenShare(reading)}
                  aria-label={t("share")}
                  title={t("share")}
                >
                  <ShareIcon />
                </button>
                <button
                  type="button"
                  className="reading-history__action"
                  onClick={() => setPrintingId(reading.id)}
                  aria-label={t("print")}
                  title={t("print")}
                >
                  <PrintIcon />
                </button>
                <button
                  type="button"
                  className="reading-history__action"
                  onClick={() => handleOpenRename(reading)}
                  aria-label={t("rename")}
                  title={t("rename")}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="reading-history__action"
                  onClick={() => setDeleting(reading)}
                  aria-label={t("deleteEntry")}
                  title={t("deleteEntry")}
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
            {reading.note && (
              <p className="reading-history__note">{reading.note}</p>
            )}
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
        isOpen={sharing !== null}
        onClose={() => setSharing(null)}
        title={t("share")}
      >
        <div className="reading-share">
          <p className="reading-share__body">{t("shareBody")}</p>
          {shareBusy && !shareUrl ? (
            <p className="reading-history__status">{t("loading")}</p>
          ) : (
            <>
              <div className="reading-share__row">
                {/* A span, not an <input>: browsers ignore text-decoration on
                    form controls, so an underlined link has to be real text.
                    user-select:all makes one click grab the whole URL. */}
                <span className="reading-share__url">{shareUrl}</span>
                <button
                  type="button"
                  className="reading-share__network"
                  data-active={shareCopied ? "true" : undefined}
                  onClick={handleCopyShare}
                  aria-label={shareCopied ? t("shareCopied") : t("shareCopy")}
                  title={shareCopied ? t("shareCopied") : t("shareCopy")}
                >
                  <CopyIcon />
                </button>
              </div>
              <div className="reading-share__networks">
                {SHARE_NETWORKS.map(({ id, label, Icon, href }) => (
                  <a
                    key={id}
                    className="reading-share__network"
                    href={href(shareUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("shareOn", { network: label })}
                    title={t("shareOn", { network: label })}
                  >
                    <Icon />
                  </a>
                ))}
                {canNativeShare && (
                  <button
                    type="button"
                    className="reading-share__network"
                    onClick={handleNativeShare}
                    aria-label={t("shareMore")}
                    title={t("shareMore")}
                  >
                    <ShareIcon />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="reading-share__revoke"
                onClick={handleUnshare}
                disabled={shareBusy}
              >
                {t("shareRevoke")}
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={renaming !== null}
        onClose={() => setRenaming(null)}
        title={t("editEntry")}
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
            <label htmlFor="reading-note" className="form__label">
              {t("noteLabel")}
            </label>
            <textarea
              id="reading-note"
              className="form__input reading-history__note-input"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              maxLength={MAX_NOTE_LENGTH}
              rows={4}
              placeholder={t("notePlaceholder")}
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
