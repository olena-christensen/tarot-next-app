"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/Modal";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { LoginContext, useOpenLogin } from "@/components/LoginContext";

type SubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called (after this modal closes) when the plans need the user to sign in —
   * a 401 from create-invoice. Defaults to the ambient LoginContext, which is
   * correct anywhere a login modal already sits above this (e.g. PageShell).
   * The home page has no such ambient provider, so it passes this explicitly.
   */
  onRequestLogin?: () => void;
};

/**
 * The pricing plans in a modal — same content as the /subscription page.
 * Reused by the home page (reading-gate upgrade prompt) and the profile
 * (current-plan / reader-upgrade). Overrides LoginContext so a 401 closes the
 * plans and hands off to login instead of failing.
 */
export const SubscriptionModal = ({
  isOpen,
  onClose,
  onRequestLogin,
}: SubscriptionModalProps) => {
  const t = useTranslations("ui");
  const ambientOpenLogin = useOpenLogin();

  const handleLogin = () => {
    onClose();
    (onRequestLogin ?? ambientOpenLogin)();
  };

  return (
    <Modal title={t("chooseYourPath")} isOpen={isOpen} onClose={onClose} wide>
      <LoginContext.Provider value={handleLogin}>
        <SubscriptionPlans showHeader={false} />
      </LoginContext.Provider>
    </Modal>
  );
};
