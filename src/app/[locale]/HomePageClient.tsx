"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { OfferBlock } from "@/components/OfferBlock";
import { HomeAbout } from "@/components/HomeAbout";
import { Tarot } from "@/components/Tarot";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { ReadingGateModal, type GateReason } from "@/components/ReadingGateModal";
import { useOpenLogin } from "@/components/LoginContext";
import Footer from "@/components/Footer";

/**
 * The main page. The header, session and login window come from SiteChrome in
 * the locale layout, shared with every other page.
 */
export function HomePageClient() {
  const t = useTranslations("ui");
  const openLogin = useOpenLogin();

  // A refused Google sign-in lands here as /?error=… (pages.signIn in auth.ts).
  // Open the login modal with an explanation instead of failing silently, then
  // drop the query so a refresh does not reopen it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("error");
    if (authError === "GoogleNotLinked" || authError === "OAuthAccountNotLinked") {
      openLogin(t("googleNotLinked"));
      params.delete("error");
      params.delete("callbackUrl");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, [t, openLogin]);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [gateReason, setGateReason] = useState<GateReason | null>(null);

  // The gate speaks in-character first, then hands off to the real wall.
  const handleGateProceed = (reason: GateReason) => {
    setGateReason(null);
    if (reason === "anon") openLogin();
    else setIsSubscriptionOpen(true);
  };

  return (
    <>
      {/* The footer follows the page in normal flow (Lena, 2026-10-16): pinned
          to the screen bottom when the page is short, scrolled to when it isn't —
          it no longer floats over the content. */}
      <div className="page-shell">
        <main className="page-shell__main">
          <OfferBlock
            onOpenLogin={() => openLogin()}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onBlockedAnon={() => setGateReason("anon")}
            onBlockedFree={() => setGateReason("free")}
          />
        </main>
        <HomeAbout />
        <Tarot
          onBlockedAnon={() => setGateReason("anon")}
          onBlockedFree={() => setGateReason("free")}
        />
        <Footer />
      </div>
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        onRequestLogin={() => openLogin()}
      />
      <ReadingGateModal
        reason={gateReason}
        onClose={() => setGateReason(null)}
        onProceed={handleGateProceed}
      />
    </>
  );
}
