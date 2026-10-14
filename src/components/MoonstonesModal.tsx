"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/Modal";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { LoginContext, useOpenLogin } from "@/components/LoginContext";
import { Link } from "@/i18n/navigation";
import { MOONSTONE_PACKS, MOONSTONE_PACK_ORDER } from "@/lib/moonstones";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** As in SubscriptionModal: where a 401 from the payment sends the user. */
  onRequestLogin?: () => void;
};

/** Moonstones only: the three packs as tiles (Lena, 2026-10-14). */
export const MoonstonesModal = ({ isOpen, onClose, onRequestLogin }: Props) => {
  const t = useTranslations("ui");
  const ambientOpenLogin = useOpenLogin();
  const handleLogin = () => {
    onClose();
    (onRequestLogin ?? ambientOpenLogin)();
  };
  return (
    <Modal title={t("buyMoonstonesTitle")} isOpen={isOpen} onClose={onClose} narrow>
      <LoginContext.Provider value={handleLogin}>
        <SubscriptionPlans showHeader={false} moonstonesOnly />
      </LoginContext.Provider>
    </Modal>
  );
};

/**
 * Where moonstones come from: brew potions for free, or buy a pack. Opened by
 * the header balance and wherever a game runs short (Lena, 2026-10-14).
 */
export const MoreMoonstonesModal = ({ isOpen, onClose, onRequestLogin }: Props) => {
  const t = useTranslations("ui");
  const [buying, setBuying] = useState(false);
  const [a, b, c] = MOONSTONE_PACK_ORDER.map((id) => MOONSTONE_PACKS[id].qty);
  return (
    <>
      <Modal title={t("moreMoonstones")} isOpen={isOpen} onClose={onClose} narrow>
        <div className="moon-choice">
          <Link href="/game" className="moon-choice__opt" onClick={onClose}>
            <span className="moon-choice__free">{t("free")}</span>
            <span className="moon-choice__name">{t("brewPotions")}</span>
            <span className="moon-choice__text">{t("brewPotionsText")}</span>
            <span className="moon-choice__go" aria-hidden="true">›</span>
          </Link>
          <button
            type="button"
            className="moon-choice__opt"
            onClick={() => {
              onClose();
              setBuying(true);
            }}
          >
            <span className="moon-choice__name">{t("buyPack")}</span>
            <span className="moon-choice__text">{t("buyPackText", { a, b, c })}</span>
            <span className="moon-choice__go" aria-hidden="true">›</span>
          </button>
        </div>
      </Modal>
      <MoonstonesModal isOpen={buying} onClose={() => setBuying(false)} onRequestLogin={onRequestLogin} />
    </>
  );
};
