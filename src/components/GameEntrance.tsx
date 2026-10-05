"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

let hasShownOnce = false;

/**
 * The way into "Brew the Potion" from the main page: a small glowing pill that
 * floats just above the overlay footer. "A Halloween treat" in October, "A little
 * game" the rest of the year. On the first visit it waits for the intro
 * animation (the deck screen arrives at ~8s) instead of competing with it.
 */
export const GameEntrance = () => {
  const t = useTranslations("game");
  const [footerHeight, setFooterHeight] = useState(52);
  const [seasonal, setSeasonal] = useState(false);
  const [skipIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    const skip = hasShownOnce;
    hasShownOnce = true;
    return skip;
  });

  useEffect(() => {
    setSeasonal(new Date().getMonth() === 9); // October
    const footer = document.querySelector<HTMLElement>(".main-footer--overlay");
    if (!footer) return;
    const measure = () => setFooterHeight(footer.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  return (
    <Link
      href="/game"
      className={`game-entrance${skipIntro ? " game-entrance--now" : ""}`}
      style={{ bottom: footerHeight + 12 }}
    >
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
