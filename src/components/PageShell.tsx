"use client";

import { useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { LoginForm } from "@/components/LoginForm";
import { LoginContext } from "@/components/LoginContext";
import { MysticBackground } from "@/components/MysticBackground";
import { ChromeContext } from "@/components/SiteChrome";
import Footer from "@/components/Footer";

type PageShellProps = {
  children: React.ReactNode;
};

/**
 * The page and its footer. Inside the locale pages the header, session,
 * background and login window come from SiteChrome in the layout and stay put
 * between pages, so this renders only what belongs to the page itself.
 */
export const PageShell = ({ children }: PageShellProps) => {
  const inChrome = useContext(ChromeContext);
  if (inChrome) {
    return (
      <div className="page-shell">
        {children}
        <Footer />
      </div>
    );
  }
  return <StandaloneShell>{children}</StandaloneShell>;
};

/**
 * The legal pages (/privacy, /terms, /cookie-policy, /refund) live outside the
 * locale layout, so they bring their own header and session.
 */
const StandaloneShell = ({ children }: PageShellProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const t = useTranslations("ui");

  return (
    <Providers>
      <MysticBackground />
      <div className="page-shell">
        <Header onOpenLogin={() => setIsLoginOpen(true)} />
        <LoginContext.Provider value={() => setIsLoginOpen(true)}>
          {children}
        </LoginContext.Provider>
        <Footer />
      </div>
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
