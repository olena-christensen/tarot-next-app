"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Signed-in stand-in for the header's language globe. Language stays reachable
 * from the profile, which is exactly where this links.
 */
export const HeaderAvatar = () => {
  const { data: session } = useSession();
  const t = useTranslations("ui");

  const image = session?.user?.image ?? null;
  const initial = (session?.user?.name || "?").charAt(0).toUpperCase();

  return (
    <Link href="/profile" className="header-avatar" aria-label={t("profileTitle")}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="header-avatar__img" />
      ) : (
        <span className="header-avatar__fallback" aria-hidden="true">
          {initial}
        </span>
      )}
    </Link>
  );
};
