"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Loader } from "@/components/Loader";
import { applyHalloweenPhase, msUntilHalloween, splitCountdown } from "@/lib/halloween";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The Halloween countdown strip at the very top of every page, above the
 * header (mounted once in SiteChrome); it opens the games page like the
 * pumpkin pill. When it shows: src/lib/halloween.ts (CSS keys off
 * <html data-halloween>, set before the first paint).
 *
 * Both layouts are in the markup, one visible per breakpoint: a single slim
 * row on phones, so the first screen does not get crowded, and digit boxes
 * from md up. The numbers fill in after load; until then a placeholder of the
 * same width holds their place, so nothing moves.
 */
export const HalloweenBanner = () => {
  const t = useTranslations("game");
  const [left, setLeft] = useState<number | null>(null);
  const [going, setGoing] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // Keeps the attribute right for a visitor who leaves the page open
      // across midnight into 31 October or 1 November.
      applyHalloweenPhase(now);
      setLeft(msUntilHalloween(now));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // The strip lives in the layout and never unmounts, so the loader has to be
  // cleared by the navigation finishing, not by the page going away.
  useEffect(() => setGoing(false), [pathname]);

  const parts = left === null ? null : splitCountdown(left);
  // Hidden "00" rather than a dash: in tabular digits it is exactly as wide as
  // the number that replaces it.
  const show = (n: number | undefined) =>
    n === undefined ? <span className="halloween-banner__pending">00</span> : pad(n);

  const units = [
    { key: "days", value: show(parts?.days), label: t("bannerDays") },
    { key: "hours", value: show(parts?.hours), label: t("bannerHours") },
    { key: "minutes", value: show(parts?.minutes), label: t("bannerMinutes") },
    { key: "seconds", value: show(parts?.seconds), label: t("bannerSeconds") },
  ];

  return (
    <>
      <Link href="/game" className="halloween-banner" onClick={() => setGoing(pathname !== "/game")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="halloween-banner__pumpkin" src="/game-art/pumpkin-hat.webp" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="halloween-banner__flame" src="/game-art/potion/candle-flame-1.webp" alt="" aria-hidden="true" />

        <span className="halloween-banner__clock">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="halloween-banner__steam" src="/game-art/potion/steam-wisp-1.webp" alt="" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="halloween-banner__steam halloween-banner__steam--late" src="/game-art/potion/steam-wisp-2.webp" alt="" aria-hidden="true" />

          <span className="halloween-banner__countdown">
            <span className="halloween-banner__kicker">{t("bannerKicker")}</span>
            {/* Phones: one compact line. */}
            <span className="halloween-banner__line">
              {show(parts?.days)}
              <span className="halloween-banner__line-unit">{t("bannerDaysShort")}</span>{" "}
              {show(parts?.hours)}:{show(parts?.minutes)}:{show(parts?.seconds)}
            </span>
            {/* md and up: digit boxes. */}
            <span className="halloween-banner__units">
              {units.map((u) => (
                <span key={u.key} className="halloween-banner__unit">
                  <span className="halloween-banner__value">{u.value}</span>
                  <span className="halloween-banner__label">{u.label}</span>
                </span>
              ))}
            </span>
          </span>

          <span className="halloween-banner__night">{t("bannerNight")}</span>
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="halloween-banner__flame" src="/game-art/potion/candle-flame-1.webp" alt="" aria-hidden="true" />

        <span className="halloween-banner__cta">
          <span className="halloween-banner__cta-short">{t("bannerCtaShort")} →</span>
          <span className="halloween-banner__cta-full">
            <span className="halloween-banner__cta-kicker">{t("entranceDefault")}</span>
            <span className="halloween-banner__cta-text">{t("entranceCta")} →</span>
          </span>
        </span>
      </Link>
      {going && <Loader top />}
    </>
  );
};
