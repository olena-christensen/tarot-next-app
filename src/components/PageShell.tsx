"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { LoginForm } from "@/components/LoginForm";
import Footer from "@/components/Footer";

type PageShellProps = {
  children: React.ReactNode;
};

export const PageShell = ({ children }: PageShellProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const t = useTranslations("ui");

  return (
    <Providers>
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      {children}
      <Footer />
      <Modal
        title={t("stepThroughTheVeil")}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      >
        <LoginForm onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
    </Providers>
  );
};
