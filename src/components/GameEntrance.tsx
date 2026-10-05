"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * The way into "Brew the Potion" from the main page: a small glowing pill in
 * the reader block, under "Change your reader" — part of the block's own flow,
 * so it moves with it and never covers the buttons (it used to float above the
 * footer and landed on them on short screens). "A Halloween treat" in October,
 * "A little game" the rest of the year.
 */
export const GameEntrance = () => {
  const t = useTranslations("game");
  const [seasonal, setSeasonal] = useState(false);

  useEffect(() => {
    setSeasonal(new Date().getMonth() === 9); // October
  }, []);

  return (
    <Link href="/game" className="game-entrance">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="game-entrance__bottle" src="/game-art/potion/bottle.webp" alt="" />
      <span className="game-entrance__text">
        <span className="game-entrance__kicker">
          {seasonal ? t("entranceSeasonal") : t("entranceDefault")}
        </span>
        <span className="game-entrance__cta">{t("entranceCta")} →</span>
      </span>
    </Link>
  );
};
