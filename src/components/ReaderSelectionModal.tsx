"use client";

import { useState, useEffect } from "react";
import { useTranslations, useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { useAppContext } from "@/AppProvider";
import { Modal } from "@/components/Modal";
import { ReaderSelection } from "@/components/ReaderSelection";
import { type ReaderId } from "@/lib/readers";

// Read + cleared by OfferBlock on the home page to reveal the deck on arrival —
// makes the modal's Summon behave like the main-page Summon (go home, show deck).
const REVEAL_DECK_KEY = "theveil_reveal_deck";

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
  const router = useRouter();

  // Premium readers are unlocked for paid tiers (MONTHLY/YEARLY). Read the real
  // plan from the server; refresh whenever the modal opens so a just-purchased
  // subscription unlocks without a reload.
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    if (!isOpen || !session?.user) {
      return;
    }
    let cancelled = false;
    fetch("/api/user/plan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          // Server-computed entitlement (active tier, expiry included) — never
          // re-derive it from planId here.
          setIsSubscriber(Boolean(data.isSubscriber));
        }
      })
      .catch(() => {
        // silent — stays locked; user can retry
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, session?.user]);

  // Set + persist the reader (session + DB). Shared by both entry points.
  const persistReader = (readerId: ReaderId) => {
    setState(prev => ({ ...prev, selectedReader: readerId }));

    if (session?.user) {
      fetch("/api/user/reader", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reader: readerId }),
      }).then(() => update({ preferredReader: readerId }));
    }
  };

  // Clicking a card: choose without leaving the modal.
  const handleChoose = (readerId: ReaderId) => {
    persistReader(readerId);
  };

  // Summon button: choose, then go to the home page and reveal the deck —
  // same outcome as clicking Summon on the main page.
  const handleSelect = (readerId: ReaderId) => {
    persistReader(readerId);
    onClose();
    sessionStorage.setItem(REVEAL_DECK_KEY, "1");
    router.push("/");
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
        onChoose={handleChoose}
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
