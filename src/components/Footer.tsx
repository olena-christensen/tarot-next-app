"use client";
import NextLink from "next/link";
import { Link as IntlLink } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { resetCookieConsent } from "@/components/CookieBanner";

export default function Footer({ overlay = false }: { overlay?: boolean }) {
    const t = useTranslations("ui");
    const tDisc = useTranslations("disclaimers");
    const tCards = useTranslations("cardMeanings");
    return (
        <footer className={`main-footer container${overlay ? " main-footer--overlay" : ""}`}>
            <p className="main-footer__disclaimer">{tDisc("entertainmentFull")}</p>
            <p className="main-footer__legal">
                <IntlLink className="main-footer__link" href="/cards">{tCards("navLabel")}</IntlLink>
                {" · "}
                <NextLink className="main-footer__link" href="/terms">{t("termsOfService")}</NextLink>
                {" · "}
                <NextLink className="main-footer__link" href="/privacy">{t("privacyPolicy")}</NextLink>
                {" · "}
                <NextLink className="main-footer__link" href="/cookie-policy">{t("cookiePolicy")}</NextLink>
                {" · "}
                <NextLink className="main-footer__link" href="/refund">{t("refundPolicy")}</NextLink>
                {" · "}
                <IntlLink className="main-footer__link" href="/contact">{t("contact")}</IntlLink>
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
