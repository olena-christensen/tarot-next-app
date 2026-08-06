"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShareDialog } from "@/components/ShareDialog";
import ShareIcon from "@/assets/svg/share.svg";

type Props = {
  /** Absolute URL, resolved on the server — this page is static, so there is no window to read. */
  url: string;
  cardTitle: string;
};

/**
 * The card page is already public, so unlike a shared reading there is no link
 * to mint and nothing to revoke — it hands its own URL to the shared dialog.
 */
export const CardShareButton = ({ url, cardTitle }: Props) => {
  const t = useTranslations("cardMeanings");
  const tHistory = useTranslations("history");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="card-page__share"
        onClick={() => setIsOpen(true)}
      >
        <ShareIcon />
        <span>{tHistory("share")}</span>
      </button>
      <ShareDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        url={url}
        shareTitle={cardTitle}
        body={t("shareBody")}
      />
    </>
  );
};
