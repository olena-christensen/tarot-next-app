"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/Modal";
import { MysticButton } from "@/components/MysticButton";

export type GateReason = "anon" | "free";

type ReadingGateModalProps = {
  /** Why the reading was blocked, or null when the gate is closed. */
  reason: GateReason | null;
  onClose: () => void;
  /**
   * Fired when the user accepts the prompt — the parent hands off to the login
   * modal (anon) or the subscription modal (free) accordingly.
   */
  onProceed: (reason: GateReason) => void;
};

/**
 * In-character prompt shown BEFORE the auth / payment wall. When a reading is
 * blocked we don't slam the login or pricing modal in the visitor's face — we
 * first speak in the app's voice, then a single button carries them onward.
 */
export const ReadingGateModal = ({
  reason,
  onClose,
  onProceed,
}: ReadingGateModalProps) => {
  const t = useTranslations("ui");
  const isAnon = reason === "anon";

  return (
    <Modal
      title={isAnon ? t("gateAnonTitle") : t("gateFreeTitle")}
      isOpen={reason !== null}
      onClose={onClose}
    >
      <div className="reading-gate">
        <p className="reading-gate__body">
          {isAnon ? t("gateAnonBody") : t("gateFreeBody")}
        </p>
        <MysticButton
          className="reading-gate__cta"
          onClick={() => reason && onProceed(reason)}
        >
          {isAnon ? t("gateAnonCta") : t("gateFreeCta")}
        </MysticButton>
      </div>
    </Modal>
  );
};
