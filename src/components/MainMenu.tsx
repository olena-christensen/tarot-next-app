"use client";

import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

type MainMenuProps = {
    onOpenLogin: () => void;
};

export default function MainMenu({ onOpenLogin }: MainMenuProps) {
    const { data: session, status } = useSession();
    const t = useTranslations("ui");

    return (
        <nav className="main-menu">
            <ul className="main-menu__list">
                {status === "loading" ? null : session ? (
                    <li className="main-menu__item">
                        <Link className="btn main-menu__link" href="/profile">
                            {t("welcome", { name: session.user?.name || t("mysticOne") })}
                        </Link>
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
