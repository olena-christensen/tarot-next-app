"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeaderGreeting } from "@/components/HeaderGreeting";

type MainMenuProps = {
    onOpenLogin: () => void;
};

export default function MainMenu({ onOpenLogin }: MainMenuProps) {
    const { data: session, status } = useSession();
    const t = useTranslations("ui");
    const tCards = useTranslations("cardMeanings");

    return (
        <nav className="main-menu">
            <ul className="main-menu__list">
                <li className="main-menu__item">
                    <Link className="btn main-menu__link" href="/cards">
                        {tCards("navLabel")}
                    </Link>
                </li>
                {status === "loading" ? null : session ? (
                    // Desktop placement. The LI is what hides below `md` — a class
                    // on the link itself loses to `.main-menu .main-menu__link` on
                    // specificity. The fixed strip in Header.tsx shows instead; a
                    // sentence has no room in the nav row on a phone.
                    <li className="main-menu__item main-menu__item--greeting">
                        <HeaderGreeting className="btn main-menu__link" />
                    </li>
                ) : (
                    <li className="main-menu__item">
                        <button
                            className="btn main-menu__link"
                            onClick={onOpenLogin}
                        >
                            {t("revealYourself")}
                        </button>
                    </li>
                )}
            </ul>
        </nav>
    );
}
