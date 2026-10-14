"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader } from "@/components/Loader";

/**
 * The way into the games from the main page (Lena, 2026-10-09): a glowing
 * button with a pumpkin in a witch hat, in the reader block's own flow under
 * "Change your reader". It opens the games page /game (Lena, 2026-10-14; it
 * used to open a pop-up with the same cards), behind the dark loader.
 * "Halloween is coming" in October, "Witchy games" the rest of the year.
 */
export const GameEntrance = () => {
  const t = useTranslations("game");
  const [seasonal, setSeasonal] = useState(false);
  const [going, setGoing] = useState(false);

  useEffect(() => {
    setSeasonal(new Date().getMonth() === 9); // October
  }, []);

  return (
    <>
      <Link href="/game" className="game-entrance" onClick={() => setGoing(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="game-entrance__pumpkin" src="/game-art/pumpkin-hat.webp" alt="" />
        <span className="game-entrance__text">
          <span className="game-entrance__kicker">
            {seasonal ? t("entranceSeasonal") : t("entranceDefault")}
          </span>
          <span className="game-entrance__cta">{t("entranceCta")} →</span>
        </span>
      </Link>
      {going && <Loader top />}
    </>
  );
};
