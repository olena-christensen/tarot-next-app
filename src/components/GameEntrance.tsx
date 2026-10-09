"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Modal } from "@/components/Modal";

/**
 * The way into the games from the main page (Lena, 2026-10-09): a glowing
 * button with a pumpkin in a witch hat, in the reader block's own flow under
 * "Change your reader" (it used to float and covered the buttons on short
 * screens). It opens a choice of the games as big picture cards.
 * "Halloween is coming" in October, "Witchy games" the rest of the year.
 */
export const GameEntrance = () => {
  const t = useTranslations("game");
  const [seasonal, setSeasonal] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSeasonal(new Date().getMonth() === 9); // October
  }, []);

  return (
    <>
      <button type="button" className="game-entrance" onClick={() => setOpen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="game-entrance__pumpkin" src="/game-art/pumpkin-hat.webp" alt="" />
        <span className="game-entrance__text">
          <span className="game-entrance__kicker">
            {seasonal ? t("entranceSeasonal") : t("entranceDefault")}
          </span>
          <span className="game-entrance__cta">{t("entranceCta")} →</span>
        </span>
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="game-choice">
          <h2 className="game-choice__title">{seasonal ? t("choiceTitleSeasonal") : t("choiceTitle")}</h2>
          <p className="game-choice__sub">{t("choiceSub")}</p>
          <Link href="/game" className="game-choice__card" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/game-art/cover-potion.jpg" alt="" />
            <span className="game-choice__shade" />
            <span className="game-choice__text">
              <b>{t("title")}</b>
              <span>{t("choicePotion")}</span>
            </span>
            <span className="game-choice__go">{t("choicePlay")}</span>
          </Link>
          <Link href="/castle" className="game-choice__card" onClick={() => setOpen(false)}>
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
        </div>
      </Modal>
    </>
  );
};
