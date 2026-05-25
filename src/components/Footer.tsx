"use client";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { resetCookieConsent } from "@/components/CookieBanner";

export default function Footer() {
    const t = useTranslations("ui");
    return (
        <footer className="main-footer container">
            <p className="main-footer__legal">
                <NextLink className="main-footer__link" href="/terms">{t("termsOfService")}</NextLink>
                {" · "}
                <NextLink className="main-footer__link" href="/privacy">{t("privacyPolicy")}</NextLink>
                {" · "}
                <NextLink className="main-footer__link" href="/cookie-policy">{t("cookiePolicy")}</NextLink>
                {" · "}
                <button
                    type="button"
                    className="main-footer__link main-footer__link--button"
                    onClick={resetCookieConsent}
                >
                    {t("cookieSettings")}
                </button>
            </p>
        </footer>
    );
};
