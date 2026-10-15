"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShareDialog } from "@/components/ShareDialog";
import ShareIcon from "@/assets/svg/share.svg";

type Props = {
  /** Absolute URL, resolved on the server. */
  url: string;
  shareTitle: string;
  /** Extra class, so the same button can be a small outline or the glowing one. */
  className?: string;
  label?: string;
};

export const DreamShareButton = ({ url, shareTitle, className = "dream-share", label }: Props) => {
  const tHistory = useTranslations("history");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setIsOpen(true)}>
        <ShareIcon />
        <span>{label ?? tHistory("share")}</span>
      </button>
      <ShareDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        url={url}
        shareTitle={shareTitle}
        compact
      />
    </>
  );
};
