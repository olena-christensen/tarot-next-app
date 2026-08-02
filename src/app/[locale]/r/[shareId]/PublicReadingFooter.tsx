"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * The only call to action on a shared page: a stranger who read someone's
 * reading should be one click from drawing their own.
 */
export function PublicReadingFooter() {
  const t = useTranslations("history");

  return (
    <div className="shared-reading__cta">
      <p className="shared-reading__cta-text">{t("sharedCtaText")}</p>
      <Link href="/" className="btn shared-reading__cta-btn">
        {t("sharedCta")}
      </Link>
    </div>
  );
}
