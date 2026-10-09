"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { track } from "@vercel/analytics";
import { useOpenLogin } from "@/components/LoginContext";
import { rememberReturnPath } from "@/lib/potionGame/claim";
import type { GiftView } from "@/lib/castleGame/server";

type Result = "taken-by-you" | "own" | "taken" | "gone" | "failed";

/**
 * "Take the gift" on a friend's castle gift page. Signed-in friends get it
 * straight away; others sign in first (Google comes back here), then get it.
 */
export const CastleGiftTake = ({ giftId, status }: { giftId: string; status: GiftView["status"] }) => {
  const t = useTranslations("castle");
  const { status: authStatus } = useSession();
  const openLogin = useOpenLogin();
  const [result, setResult] = useState<Result | null>(null);
  const asked = useRef(false);

  const take = useCallback(async () => {
    if (asked.current) return;
    asked.current = true;
    try {
      const res = await fetch("/api/castle/gift/take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId }),
      });
      const data = await res.json();
      if (data.itemId) {
        setResult("taken-by-you");
        track("castle_gift_taken");
      } else {
        setResult((data.error as Result) ?? "failed");
      }
    } catch {
      asked.current = false;
      setResult("failed");
    }
  }, [giftId]);

  useEffect(() => {
    if (status === "available" && authStatus === "authenticated") void take();
  }, [status, authStatus, take]);

  if (result === "taken-by-you") return <p className="castle-gift__note">{t("giftTakenYou")}</p>;
  if (result === "own") return <p className="castle-gift__note">{t("giftOwn")}</p>;
  if (status !== "available" || result === "taken" || result === "gone") {
    return <p className="castle-gift__note">{t("giftTaken")}</p>;
  }

  return (
    <div className="castle-gift__take">
      <a
        href="#"
        className="castle-gift__take-link"
        onClick={(e) => {
          e.preventDefault();
          if (authStatus === "authenticated") {
            asked.current = false;
            void take();
            return;
          }
          rememberReturnPath();
          openLogin();
        }}
      >
        {t("takeGift")}
      </a>
      <p className="castle-gift__note">{t("takeHint")}</p>
    </div>
  );
};
