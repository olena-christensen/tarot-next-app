"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MOONSTONES_CHANGED_EVENT } from "@/lib/moonstones";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import MoonstoneIcon from "@/assets/svg/moonstone.svg";

type HeaderMoonstonesProps = {
  onOpenLogin: () => void;
};

/**
 * Signed-in moonstone balance, beside the avatar. Opens the price list (the
 * avatar already covers the profile). Renders nothing until the balance has
 * loaded, so the header never flashes a wrong number. The modal portals to
 * <body>, so the header's transform doesn't trap it.
 */
export const HeaderMoonstones = ({ onOpenLogin }: HeaderMoonstonesProps) => {
  const t = useTranslations("ui");
  const [count, setCount] = useState<number | null>(null);
  const [isPlansOpen, setIsPlansOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/user/plan", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(typeof data.readingCredits === "number" ? data.readingCredits : 0);
    } catch {
      // Keep the last known value on a network blip.
    }
  }, []);

  useEffect(() => {
    load();
    // Refetch when something in this tab changes the balance, and when the
    // visitor comes back from the monobank tab.
    window.addEventListener(MOONSTONES_CHANGED_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener(MOONSTONES_CHANGED_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  if (count === null) return null;

  const label = t("moonstonesCount", { count });

  return (
    <>
      <button
        type="button"
        className={`header-moonstones${count === 0 ? " header-moonstones--empty" : ""}`}
        onClick={() => setIsPlansOpen(true)}
        aria-label={label}
        title={label}
      >
        <MoonstoneIcon className="header-moonstones__icon" aria-hidden="true" />
        <span className="header-moonstones__count">{count}</span>
      </button>
      <SubscriptionModal
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
        onRequestLogin={onOpenLogin}
      />
    </>
  );
};
