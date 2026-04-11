"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {ShiningElement} from "@/components/ShiningElement";
import Bottle1 from "../assets/svg/bottle1.svg";
import Bottle2 from "../assets/svg/bottle2.svg";
import Twink from "../assets/svg/twink.svg";

export default function Footer() {
    const t = useTranslations("ui");
    return (
        <footer className="main-footer container">
            {/*<ShiningElement elementIndex={3} svgElement={<Twink />} />*/}
            {/*<ShiningElement elementIndex={1} svgElement={<Bottle1 />} />*/}
            {/*<ShiningElement elementIndex={2} svgElement={<Bottle2 />} />*/}
            <p className="main-footer__legal">
                <Link className="main-footer__link" href="/terms">{t("termsOfService")}</Link>
                {" · "}
                <Link className="main-footer__link" href="/privacy">{t("privacyPolicy")}</Link>
            </p>
        </footer>
    );
};
