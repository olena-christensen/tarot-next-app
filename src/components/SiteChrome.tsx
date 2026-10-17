"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { HalloweenBanner } from "@/components/HalloweenBanner";
import { Modal } from "@/components/Modal";
import { LoginForm } from "@/components/LoginForm";
import { LoginContext } from "@/components/LoginContext";
import { MysticBackground } from "@/components/MysticBackground";
import { Loader } from "@/components/Loader";
import { useAppContext } from "@/AppProvider";

/**
 * True inside SiteChrome. PageShell reads it to know the header, providers and
 * login window already exist above it, so it renders only the page and footer.
 */
export const ChromeContext = createContext(false);

/** Pages deliberately without the site header (a stranger's shared reading, the payment return). */
const BARE_PATHS = [/^\/r\//, /^\/payment\//];

/**
 * The parts of the site that stay put while visitors move between pages
 * (Lena, 2026-10-15): the session, the header, the background and the login
 * window. They live in the locale layout, so a navigation swaps only the page
 * under them. Before, every page mounted its own copy: the header and the
 * background were rebuilt on every click and the session was fetched again,
 * so the header flashed signed out and the page jumped once it knew.
 */
export const SiteChrome = ({ children }: { children: React.ReactNode }) => (
  <Providers>
    <ChromeContext.Provider value={true}>
      <ChromeInner>{children}</ChromeInner>
    </ChromeContext.Provider>
  </Providers>
);

const ChromeInner = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("ui");
  const pathname = usePathname();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();

  const openLogin = useCallback((message?: string) => {
    setNotice(message);
    setIsLoginOpen(true);
  }, []);

  // The app state now outlives pages: leaving the main page mid-reading (the
  // browser's back button) must not bring the reading screen back later.
  const { setState } = useAppContext();
  useEffect(() => {
    setState((prev) => (prev.isCardsModalOpen ? { ...prev, isCardsModalOpen: false } : prev));
  }, [pathname, setState]);

  const bare = BARE_PATHS.some((re) => re.test(pathname));
  const home = pathname === "/";

  return (
    <LoginContext.Provider value={openLogin}>
      {/* The main page draws its own medallions. */}
      {!bare && !home && <MysticBackground />}
      {/* Above the header on every page, in October only (src/lib/halloween.ts). */}
      {!bare && <HalloweenBanner />}
      {!bare && <Header onOpenLogin={() => openLogin()} />}
      {children}
      <Modal
        title={t("stepThroughTheVeil")}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      >
        <LoginForm notice={notice} onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
      <FirstLoadVeil />
    </LoginContext.Provider>
  );
};

/**
 * Covers the very first paint until the session is known, then fades out and
 * never comes back (the session now outlives navigations). Without it the
 * header first draws signed out, then signed in, and the page moves under it.
 */
const FirstLoadVeil = () => {
  const { status } = useSession();
  const [phase, setPhase] = useState<"on" | "leaving" | "gone">("on");

  useEffect(() => {
    if (phase === "on" && status !== "loading") setPhase("leaving");
  }, [status, phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("gone"), 300); // the fade in _loader.scss
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;
  return <Loader leaving={phase === "leaving"} />;
};
