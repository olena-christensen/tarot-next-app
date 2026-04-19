"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OfferBlock } from "@/components/OfferBlock";
import { Tarot } from "@/components/Tarot";
import { Modal } from "@/components/Modal";
import { LoginForm } from "@/components/LoginForm";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";

export function HomePageClient() {
  const t = useTranslations("ui");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  return (
    <Providers>
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      <main className="">
        <OfferBlock
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenSubscription={() => setIsSubscriptionOpen(true)}
        />
        <Tarot />
      </main>
      <Modal
        title={t("stepThroughTheVeil")}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      >
        <LoginForm onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
      <Modal
        title={t("chooseYourPath")}
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        wide
      >
        <SubscriptionPlans showHeader={false} />
      </Modal>
    </Providers>
  );
}
