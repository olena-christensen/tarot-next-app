"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { useOpenLogin } from "@/components/LoginContext";
import { MoonstoneProgress, PotionMoonRow } from "@/components/PotionMoonRow";
import { rememberReturnPath } from "@/lib/potionGame/claim";
import type { GiftStatus, PotionProgress } from "@/lib/potionGame/reward";
import { notifyMoonstonesChanged } from "@/lib/moonstones";

type Result = { progress: PotionProgress } | { error: "own" | "taken" | "gone" | "failed" };

/**
 * On a friend's gift page: "Take the potion". Signed-in friends get it straight
 * away; others sign in first (Google comes back here) and then get it.
 */
export const PotionGiftTake = ({ roundId, status }: { roundId: string; status: GiftStatus }) => {
  const t = useTranslations("game");
  const { status: authStatus } = useSession();
  const openLogin = useOpenLogin();
  const [result, setResult] = useState<Result | null>(null);
  const asked = useRef(false);

  const take = useCallback(async () => {
    if (asked.current) return;
    asked.current = true;
    try {
      const res = await fetch("/api/game/gift/take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId }),
      });
      const data = await res.json();
      if (data.progress) {
        setResult({ progress: data.progress });
        track("potion_gift_taken");
        notifyMoonstonesChanged();
      } else {
        setResult({ error: data.error ?? "failed" });
      }
    } catch {
      asked.current = false; // let them try again
      setResult({ error: "failed" });
    }
  }, [roundId]);

  useEffect(() => {
    if (status === "available" && authStatus === "authenticated") void take();
  }, [status, authStatus, take]);

  if (status !== "available" || (result && "error" in result && result.error !== "failed")) {
    // Their own potion: nothing to take, nothing to explain.
    if (result && "error" in result && result.error === "own") return null;
    return <p className="potion-gift__note">{t("giftTaken")}</p>;
  }
  if (result && "progress" in result) return <MoonstoneProgress progress={result.progress} />;

  const onTake = (e: React.MouseEvent) => {
    e.preventDefault();
    if (authStatus === "authenticated") {
      void take();
      return;
    }
    rememberReturnPath();
    openLogin();
  };

  return (
    <PotionMoonRow lit={0} pending>
      <a href="#" className="potion-moon__link" onClick={onTake}>
        {t("takePotion")}
      </a>
      <p className="potion-moon__sub">{t("takeHint")}</p>
    </PotionMoonRow>
  );
};
