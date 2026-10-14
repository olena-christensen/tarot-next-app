"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader } from "@/components/Loader";

/**
 * The games as big picture cards: in the pop-up on the main page and on the
 * games page /game (Lena, 2026-10-14). Picking one covers the screen with the
 * dark loader until the game opens. "Halloween games" in October.
 */
export const GameChoice = ({ inDialog = false }: { inDialog?: boolean }) => {
  const t = useTranslations("game");
  const [seasonal, setSeasonal] = useState(false);
  const [going, setGoing] = useState(false);
  useEffect(() => {
    setSeasonal(new Date().getMonth() === 9); // October
  }, []);
  const Title = inDialog ? "h2" : "h1";

  return (
    <div className={`game-choice${inDialog ? "" : " game-choice--page"}`}>
      <Title className="game-choice__title">{seasonal ? t("choiceTitleSeasonal") : t("choiceTitle")}</Title>
      <p className="game-choice__sub">{t("choiceSub")}</p>
      <Link href="/potion" className="game-choice__card" onClick={() => setGoing(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/game-art/cover-potion.jpg" alt="" />
        <span className="game-choice__shade" />
        <span className="game-choice__text">
          <b>{t("title")}</b>
          <span>{t("choicePotion")}</span>
        </span>
        <span className="game-choice__go">{t("choicePlay")}</span>
      </Link>
      <Link href="/castle" className="game-choice__card" onClick={() => setGoing(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/game-art/cover-castle.jpg" alt="" />
        <span className="game-choice__new">{t("choiceNew")}</span>
        <span className="game-choice__shade" />
        <span className="game-choice__text">
          <b>{t("castleTitle")}</b>
          <span>{t("choiceCastle")}</span>
        </span>
        <span className="game-choice__go">{t("choiceEnter")}</span>
      </Link>
      {going && <Loader top />}
    </div>
  );
};
