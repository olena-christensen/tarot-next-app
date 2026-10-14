"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { INTRO_DONE_EVENT, isIntroPlaying } from "@/lib/intro";

const STORAGE_KEY = "theveil_cookie_consent";
const RESET_EVENT = "theveil:cookie-consent-reset";
// While the home page intro plays (src/lib/intro.ts) the banner waits for
// `theveil:intro-done`, fired as the reader appears or on skip.
const INTRO_FALLBACK_MS = 4000;

type Consent = "accepted" | "rejected";

export const CookieBanner = () => {
  const t = useTranslations("ui");
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = window.localStorage.getItem(STORAGE_KEY);

    let fallback: number | undefined;
    const reveal = () => {
      window.clearTimeout(fallback);
      setIsVisible(true);
    };

    if (!stored) {
      if (isIntroPlaying()) {
        // Intro is animating — wait for it to finish. Fallback so a missed
        // event can never leave the banner permanently hidden.
        window.addEventListener(INTRO_DONE_EVENT, reveal, { once: true });
        fallback = window.setTimeout(reveal, INTRO_FALLBACK_MS);
      } else {
        setIsVisible(true);
      }
    }

    const handleReset = () => {
      setIsClosing(false);
      setIsVisible(true);
    };
    window.addEventListener(RESET_EVENT, handleReset);
    return () => {
      window.removeEventListener(RESET_EVENT, handleReset);
      window.removeEventListener(INTRO_DONE_EVENT, reveal);
      window.clearTimeout(fallback);
    };
  }, []);

  const dismiss = (choice: Consent) => {
    window.localStorage.setItem(STORAGE_KEY, choice);
    setIsClosing(true);
    window.setTimeout(() => setIsVisible(false), 300);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <>
    <div
      className={`cookie-banner__backdrop${isClosing ? " cookie-banner__backdrop--closing" : ""}`}
      aria-hidden="true"
    />
    <div
      className={`cookie-banner${isClosing ? " cookie-banner--closing" : ""}`}
      role="region"
      aria-label={t("cookieBannerAriaLabel")}
    >
      <div className="cookie-banner__inner">
        <p className="cookie-banner__message">
          {t("cookieBannerMessage")}{" "}
          <Link href="/cookie-policy" className="cookie-banner__link">
            {t("cookieBannerLearnMore")}
          </Link>
        </p>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--reject"
            onClick={() => dismiss("rejected")}
          >
            {t("cookieBannerReject")}
          </button>
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--accept"
            onClick={() => dismiss("accepted")}
          >
            {t("cookieBannerAccept")}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export const resetCookieConsent = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(RESET_EVENT));
};
