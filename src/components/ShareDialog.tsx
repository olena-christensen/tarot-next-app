"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/Modal";
import ShareIcon from "@/assets/svg/share.svg";
import CopyIcon from "@/assets/svg/copy.svg";
import XIcon from "@/assets/svg/x.svg";
import FacebookIcon from "@/assets/svg/facebook.svg";
import TelegramIcon from "@/assets/svg/telegram.svg";
import WhatsAppIcon from "@/assets/svg/whatsapp.svg";

// Plain intent URLs — no third-party SDKs, so no trackers load and nothing
// needs cookie consent. Each pre-fills the link in the network's own composer;
// brand names are the accessible label (they aren't translated).
export const SHARE_NETWORKS = [
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

type ShareDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  /** The link being shared. Empty while `isBusy` is minting one. */
  url: string;
  /** Title handed to the native share sheet. */
  shareTitle: string;
  /** Modal heading. Omit for a bare dialog. */
  title?: string;
  /** One line saying what this link exposes. Omit where there is nothing to warn about. */
  body?: string;
  /** Tightens the spacing for a dialog with no heading and no body. */
  compact?: boolean;
  /** True while a link is being minted; shows a placeholder instead of an empty row. */
  isBusy?: boolean;
  /**
   * Omit for links that are simply public pages — there is nothing to revoke.
   * Supplied by the reading history, where the link is a minted credential.
   */
  onRevoke?: () => void;
};

/**
 * The one share dialog in the app: copy link, plain intent URLs, and the native
 * sheet where the browser has one. Shared readings mint a revocable link and
 * pass `onRevoke`; pages that are already public just pass their own URL.
 *
 * Labels come from the `history` namespace, which already carries them in all
 * five locales — a second set of translations for the same six words would only
 * drift.
 */
export const ShareDialog = ({
  isOpen,
  onClose,
  url,
  shareTitle,
  title,
  body,
  compact = false,
  isBusy = false,
  onRevoke,
}: ShareDialogProps) => {
  const t = useTranslations("history");
  const [copied, setCopied] = useState(false);
  // Resolved after mount — navigator is undefined during SSR, and reading it in
  // render would desync server and client HTML.
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && Boolean(navigator.share));
  }, []);

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Icon-only button, so "copied" is a transient highlight rather than a
      // label change — drop it back so the control doesn't look stuck.
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions) — the link is
      // selectable, so it is still obtainable by hand.
      setCopied(false);
    }
  };

  // Native share sheet where it exists (mobile, Safari, Edge); elsewhere the
  // copy button and the per-network links carry it.
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ url, title: shareTitle });
    } catch {
      // User dismissed the sheet — not an error.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} narrow>
      <div className={`reading-share${compact ? " reading-share--compact" : ""}`}>
        {body && <p className="reading-share__body">{body}</p>}
        {isBusy && !url ? (
          <p className="reading-history__status">{t("loading")}</p>
        ) : (
          <>
            <div className="reading-share__row">
              {/* A span, not an <input>: browsers ignore text-decoration on
                  form controls, so an underlined link has to be real text.
                  user-select:all makes one click grab the whole URL. */}
              <span className="reading-share__url">{url}</span>
              <button
                type="button"
                className="reading-share__network reading-share__network--copy"
                data-active={copied ? "true" : undefined}
                onClick={handleCopy}
                aria-label={copied ? t("shareCopied") : t("shareCopy")}
                title={copied ? t("shareCopied") : t("shareCopy")}
              >
                <CopyIcon />
              </button>
            </div>
            <div className="reading-share__networks">
              {SHARE_NETWORKS.map(({ id, label, Icon, href }) => (
                <a
                  key={id}
                  className="reading-share__network"
                  href={href(url)}
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
            {onRevoke && (
              <button
                type="button"
                className="reading-share__revoke"
                onClick={onRevoke}
                disabled={isBusy}
              >
                {t("shareRevoke")}
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
