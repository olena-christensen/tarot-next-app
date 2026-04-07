"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

type MainMenuProps = {
    onOpenLogin: () => void;
    onOpenProfile: () => void;
};

export default function MainMenu({ onOpenLogin, onOpenProfile }: MainMenuProps) {
    const { data: session, status } = useSession();

    return (
        <nav className="main-menu">
            <ul className="main-menu__list">
                <li className="main-menu__item">
                    <Link className="main-menu__link" href="/subscription">
                        Pricing
                    </Link>
                </li>
                {status === "loading" ? null : session ? (
                    <>
                        <li className="main-menu__item">
                            <button
                                className="btn main-menu__link"
                                onClick={onOpenProfile}
                            >
                                Welcome, {session.user?.name || "Mystic One"}
                            </button>
                        </li>
                    </>
                ) : (
                    <li className="main-menu__item">
                        <button
                            className="btn main-menu__link"
                            onClick={onOpenLogin}
                        >
                            Reveal Yourself
                        </button>
                    </li>
                )}
            </ul>
        </nav>
    );
}