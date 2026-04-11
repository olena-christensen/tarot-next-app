"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { LoginForm } from "@/components/LoginForm";
import { UserProfile } from "@/components/UserProfile";
import Footer from "@/components/Footer";

type PageShellProps = {
  children: React.ReactNode;
};

export const PageShell = ({ children }: PageShellProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const t = useTranslations("ui");

  return (
    <Providers>
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
      {children}
      <Footer />
      <Modal
        title={t("stepThroughTheVeil")}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      >
        <LoginForm onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
      <Modal
        title={t("yourMysticProfile")}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      >
        <UserProfile onClose={() => setIsProfileOpen(false)} />
      </Modal>
    </Providers>
  );
};
