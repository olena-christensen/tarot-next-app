"use client";

import { useTranslations } from "next-intl";
import MoonstoneIcon from "@/assets/svg/moonstone.svg";
import { POTIONS_PER_MOONSTONE } from "@/lib/potionGame";
import type { PotionProgress } from "@/lib/potionGame/reward";

/** Three bottles → the moonstone, with a line of text and links underneath. */
export const PotionMoonRow = ({
  lit,
  pending = false,
  ready = false,
  fresh = false,
  children,
}: {
  /** Bottles already counted today. */
  lit: number;
  /** The next bottle pulses: a potion waiting for a choice. */
  pending?: boolean;
  /** The moonstone lights up. */
  ready?: boolean;
  /** The moonstone was just earned: it pops. */
  fresh?: boolean;
  children?: React.ReactNode;
}) => {
  const done = Math.min(lit, POTIONS_PER_MOONSTONE);
  return (
    <div className="potion-moon">
      <div className="potion-moon__row" aria-hidden="true">
        {Array.from({ length: POTIONS_PER_MOONSTONE }, (_, i) => {
          const state = i < done ? "" : pending && i === done ? " potion-moon__bottle--pending" : " potion-moon__bottle--off";
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={i} className={`potion-moon__bottle${state}`} src="/game-art/potion/bottle.webp" alt="" />;
        })}
        <span className="potion-moon__arrow">→</span>
        <MoonstoneIcon
          className={`potion-moon__stone${ready ? "" : " potion-moon__stone--off"}${fresh ? " potion-moon__stone--new" : ""}`}
        />
      </div>
      {children}
    </div>
  );
};

/** Today's progress once a potion counts: kept, or taken as a gift. */
export const MoonstoneProgress = ({
  progress,
  onSignIn,
}: {
  progress: PotionProgress;
  onSignIn?: (e: React.MouseEvent) => void;
}) => {
  const t = useTranslations("game");
  const done = Math.min(progress.today, POTIONS_PER_MOONSTONE);
  const ready = done >= POTIONS_PER_MOONSTONE;
  const b = (chunks: React.ReactNode) => <b>{chunks}</b>;

  let line: React.ReactNode = null;
  if (progress.signedIn && progress.justRewarded) line = t.rich("moonstoneEarned", { b });
  else if (progress.signedIn && progress.rewarded) line = t("moonstoneTaken");
  else if (!ready) {
    line = t.rich("moonstoneProgress", { b, count: done, total: POTIONS_PER_MOONSTONE, left: POTIONS_PER_MOONSTONE - done });
  }

  return (
    <PotionMoonRow lit={done} ready={ready} fresh={progress.justRewarded}>
      {line && <p className="potion-moon__text">{line}</p>}
      {!progress.signedIn && onSignIn && (
        <a href="#" className="potion-moon__link" onClick={onSignIn}>
          {ready ? t("moonstoneClaim") : t("moonstoneKeep")}
        </a>
      )}
    </PotionMoonRow>
  );
};
