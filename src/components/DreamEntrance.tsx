"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import DreamMoon from "@/assets/svg/dream-moon.svg";

/** The second pill on the main page, under the games one: a moon and "Tell me your dream". */
export const DreamEntrance = () => {
  const t = useTranslations("dreams");

  return (
    <Link href="/dreams/tell" className="game-entrance game-entrance--dream">
      <DreamMoon className="game-entrance__moon" aria-hidden="true" />
      <span className="game-entrance__text">
        <span className="game-entrance__kicker">{t("pillKicker")}</span>
        <span className="game-entrance__cta">{t("pillCta")} →</span>
      </span>
    </Link>
  );
};
