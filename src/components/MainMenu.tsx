"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeaderGreeting } from "@/components/HeaderGreeting";
import { HeaderNavMenu } from "@/components/HeaderNavMenu";
import SearchIcon from "@/assets/svg/search.svg";
import DoorInIcon from "@/assets/svg/door-in.svg";

type MainMenuProps = {
    onOpenLogin: () => void;
    onMenuOpenChange: (open: boolean) => void;
};

export default function MainMenu({ onOpenLogin, onMenuOpenChange }: MainMenuProps) {
    const { data: session, status } = useSession();
    const t = useTranslations("ui");
    const tDreams = useTranslations("dreams");

    return (
        <nav className="main-menu">
            <ul className="main-menu__list">
                <li className="main-menu__item">
                    {/* Icon only — the label is the accessible name, not visible text. */}
                    <span className="header-tip" data-tip={tDreams("searchAllLabel")}>
                        <Link
                            className="header-icon"
                            href="/cards"
                            aria-label={tDreams("searchAllLabel")}
                        >
                            <SearchIcon aria-hidden="true" />
                        </Link>
                    </span>
                </li>
                <li className="main-menu__item">
                    <HeaderNavMenu onOpenChange={onMenuOpenChange} />
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
                        <span className="header-tip" data-tip={t("revealYourself")}>
                            <button
                                type="button"
                                className="header-icon"
                                onClick={onOpenLogin}
                                aria-label={t("revealYourself")}
                            >
                                <DoorInIcon aria-hidden="true" />
                            </button>
                        </span>
                    </li>
                )}
            </ul>
        </nav>
    );
}
