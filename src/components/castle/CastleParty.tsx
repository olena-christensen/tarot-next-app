"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { MAX_BATS } from "@/lib/castleGame/catalog";

/**
 * Party night (approved film and mockups, Lena 2026-10-13).
 *
 * The film carries only sound effects and fades to black by itself; the
 * player's own record plays alongside it. When the film is dark, the black
 * lifts off the player's real hall (the game room under this layer) and the
 * guests' rating and the Nothing Weird credit appear over it.
 */

const FILM = "/game-art/castle/film/party.mp4";
/** Phones held upright: a tall cut that follows the action (Lena, 2026-10-14). */
const FILM_TALL = "/game-art/castle/film/party-tall.mp4";
/** The film is black from here on; only the clock is still chiming. */
const DARK_AT = 23.6;
/** The record fades out under the last shots. */
const MUSIC_FADE = [21.5, 25] as const;
const MUSIC_VOLUME = 0.6;

export type PartyOutcome = { bats: number; best: number; stones: number; toNext: number | null };

type Props = {
  /** Record sample name (public/sounds/castle/<name>-sample.mp3). */
  record: string;
  /** The guests' rating; null while it loads or if it failed. */
  outcome: PartyOutcome | null;
  /** Changes on every "Watch again" so the film restarts. */
  run: number;
  /** The game's sound button is off. */
  muted: boolean;
  /** A phone held upright: the tall film. */
  tall: boolean;
  onReplay: () => void;
  /** "Share with friends": the dare link (Lena, 2026-10-14). */
  onShare: () => void;
  onClose: () => void;
};

export const CastleParty = ({ record, outcome, run, muted, tall, onReplay, onShare, onClose }: Props) => {
  const t = useTranslations("castle.party");
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [ended, setEnded] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  useEffect(() => {
    if (musicRef.current) musicRef.current.muted = muted;
  }, [muted]);

  // Start film and record together, from the beginning, on every run.
  useEffect(() => {
    setEnded(false);
    const video = videoRef.current;
    if (!video) return;
    const music = new Audio(`/sounds/castle/${record}-sample.mp3`);
    music.volume = MUSIC_VOLUME;
    music.muted = mutedRef.current;
    musicRef.current = music;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
    void music.play().catch(() => undefined);
    return () => {
      music.pause();
      musicRef.current = null;
      video.pause();
    };
  }, [run, record]);

  const onTime = () => {
    const video = videoRef.current;
    if (!video) return;
    const now = video.currentTime;
    const music = musicRef.current;
    if (music) {
      const [from, to] = MUSIC_FADE;
      const left = now <= from ? 1 : now >= to ? 0 : (to - now) / (to - from);
      music.volume = MUSIC_VOLUME * left;
      if (left === 0) music.pause();
    }
    if (now >= DARK_AT && !ended) setEnded(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && ended && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ended, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={`castle-party${ended ? " castle-party--end" : ""}`} role="dialog" aria-modal="true" aria-label={t("survived")}>
      <video
        ref={videoRef}
        className={`castle-party__film${tall ? " castle-party__film--tall" : ""}`}
        src={tall ? FILM_TALL : FILM}
        playsInline
        muted={muted}
        preload="auto"
        onTimeUpdate={onTime}
        onEnded={() => setEnded(true)}
      />
      {ended && (
        <div className="castle-party__end">
          <p className="castle-party__survived">{t("survived")}</p>
          {outcome && (
            <div className="castle-party__rating">
              <p className="castle-party__rated">{t("rated")}</p>
              <div className="castle-party__bats" role="img" aria-label={t("batsLabel", { count: outcome.bats, max: MAX_BATS })}>
                {Array.from({ length: MAX_BATS }, (_, i) => (
                  <Bat key={i} on={i < outcome.bats} />
                ))}
              </div>
              {outcome.stones > 0 && <p className="castle-party__best">{t("newBest", { count: outcome.stones })}</p>}
              <p className="castle-party__hint">
                {outcome.toNext === null ? t("perfect") : t("toNext", { count: outcome.toNext })}
              </p>
            </div>
          )}
          <div className="castle-party__credit">
            <span className="castle-party__rule" aria-hidden="true" />
            <span className="castle-party__studio">Nothing Weird</span>
            <span className="castle-party__production">Agency&nbsp;&nbsp;Production</span>
            <span className="castle-party__more">{t("moreGames")}</span>
          </div>
          <div className="castle-party__buttons">
            <button type="button" className="castle-party__btn" onClick={onReplay}>
              {t("watchAgain")}
            </button>
            <button type="button" className="castle-party__btn" onClick={onShare}>
              {t("share")}
            </button>
            <button type="button" className="castle-party__btn castle-party__btn--main" onClick={onClose}>
              {t("backToHall")}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};

const Bat = ({ on }: { on: boolean }) => (
  <svg className={`castle-party__bat${on ? " castle-party__bat--on" : ""}`} viewBox="-100 -45 200 90" aria-hidden="true">
    <path d="M0 -15 L12 -35 L18 -12 L45 -42 L100 -30 L85 -5 L95 15 L70 5 L55 25 L40 8 L20 20 L0 42 L-20 20 L-40 8 L-55 25 L-70 5 L-95 15 L-85 -5 L-100 -30 L-45 -42 L-18 -12 L-12 -35 Z" />
  </svg>
);
