"use client";

import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { resolveGreeting } from "@/lib/greetings";

type MainMenuProps = {
    onOpenLogin: () => void;
};

export default function MainMenu({ onOpenLogin }: MainMenuProps) {
    const { data: session, status } = useSession();
    const t = useTranslations("ui");
    const tGreeting = useTranslations("greetings");
    const [greeting, setGreeting] = useState<string | null>(null);
    const name = session?.user?.name ?? "";

    // Resolve once when auth settles; sessionStorage holds it stable across
    // re-renders and navigation (keyed on status, not name/t, so no reshuffle).
    useEffect(() => {
        if (status !== "authenticated") {
            setGreeting(null);
            return;
        }
        setGreeting(resolveGreeting({ name, t: tGreeting }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <nav className="main-menu">
            <ul className="main-menu__list">
                {status === "loading" ? null : session ? (
                    greeting ? (
                        <li className="main-menu__item">
                            <Link className="btn main-menu__link" href="/profile">
                                {greeting}
                            </Link>
                        </li>
                    ) : null
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
