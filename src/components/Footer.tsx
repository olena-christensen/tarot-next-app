"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { resetCookieConsent } from "@/components/CookieBanner";

export default function Footer() {
    const t = useTranslations("ui");
    return (
        <footer className="main-footer container">
            <p className="main-footer__legal">
                <Link className="main-footer__link" href="/terms">{t("termsOfService")}</Link>
                {" · "}
                <Link className="main-footer__link" href="/privacy">{t("privacyPolicy")}</Link>
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
