"use client";

import { useTranslations, useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/AppProvider";
import { Modal } from "@/components/Modal";
import { ReaderSelection } from "@/components/ReaderSelection";
import { type ReaderId } from "@/lib/readers";

type ReaderSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscription: () => void;
};

export const ReaderSelectionModal = ({
  isOpen,
  onClose,
  onOpenSubscription,
}: ReaderSelectionModalProps) => {
  const t = useTranslations("ui");
  const messages = useMessages();
  const { data: session, update } = useSession();
  const { state, setState } = useAppContext();

  const isSubscriber = false; // TODO: check subscription status

  const handleSelect = (readerId: ReaderId) => {
    setState(prev => ({ ...prev, selectedReader: readerId }));
    onClose();

    if (session?.user) {
      fetch("/api/user/reader", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reader: readerId }),
      }).then(() => update({ preferredReader: readerId }));
    }
  };

  if (!messages?.readers) return null;

  return (
    <Modal
      title={t("chooseYourReader")}
      isOpen={isOpen}
      onClose={onClose}
      wide
    >
      <ReaderSelection
        onSelect={handleSelect}
        currentReader={state.selectedReader}
        isSubscriber={isSubscriber}
        onOpenSubscription={() => {
          onClose();
          onOpenSubscription();
        }}
      />
    </Modal>
  );
};
