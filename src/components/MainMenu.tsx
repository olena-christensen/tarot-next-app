"use client";

import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

type MainMenuProps = {
    onOpenLogin: () => void;
    onOpenProfile: () => void;
};

export default function MainMenu({ onOpenLogin, onOpenProfile }: MainMenuProps) {
    const { data: session, status } = useSession();
    const t = useTranslations("ui");

    return (
        <nav className="main-menu">
            <ul className="main-menu__list">
                <li className="main-menu__item">
                    <Link className="main-menu__link" href="/subscription">
                        {t("pricing")}
                    </Link>
                </li>
                {status === "loading" ? null : session ? (
                    <>
                        <li className="main-menu__item">
                            <button
                                className="btn main-menu__link"
                                onClick={onOpenProfile}
                            >
                                {t("welcome", { name: session.user?.name || t("mysticOne") })}
                            </button>
                        </li>
                    </>
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