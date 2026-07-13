"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OfferBlock } from "@/components/OfferBlock";
import { Tarot } from "@/components/Tarot";
import { Modal } from "@/components/Modal";
import { LoginForm } from "@/components/LoginForm";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { ReadingGateModal, type GateReason } from "@/components/ReadingGateModal";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { useAppContext } from "@/AppProvider";

// The cards/reading screen (.tarot-modal) is a full screen, not a page — no
// footer belongs over it. Hidden while the cards modal is open (incl. its
// closing fade, which keeps isCardsModalOpen true).
function HomeFooter() {
  const { state } = useAppContext();
  if (state.isCardsModalOpen) return null;
  return <Footer overlay />;
}

export function HomePageClient() {
  const t = useTranslations("ui");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [gateReason, setGateReason] = useState<GateReason | null>(null);

  // The gate speaks in-character first, then hands off to the real wall.
  const handleGateProceed = (reason: GateReason) => {
    setGateReason(null);
    if (reason === "anon") setIsLoginOpen(true);
    else setIsSubscriptionOpen(true);
  };

  return (
    <Providers>
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      <main className="">
        <OfferBlock
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenSubscription={() => setIsSubscriptionOpen(true)}
          onBlockedAnon={() => setGateReason("anon")}
          onBlockedFree={() => setGateReason("free")}
        />
      </main>
      <Tarot
        onBlockedAnon={() => setGateReason("anon")}
        onBlockedFree={() => setGateReason("free")}
      />
      <HomeFooter />
      <Modal
        title={t("stepThroughTheVeil")}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      >
        <LoginForm onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        onRequestLogin={() => setIsLoginOpen(true)}
      />
      <ReadingGateModal
        reason={gateReason}
        onClose={() => setGateReason(null)}
        onProceed={handleGateProceed}
      />
    </Providers>
  );
}
