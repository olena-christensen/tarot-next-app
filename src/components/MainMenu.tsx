"use client";

import { useSession, signOut } from "next-auth/react";

type MainMenuProps = {
    onOpenLogin: () => void;
};

export default function MainMenu({ onOpenLogin }: MainMenuProps) {
    const { data: session, status } = useSession();

    return (
        <nav className="main-menu">
            <ul className="main-menu__list">
                {status === "loading" ? null : session ? (
                    <>
                        <li className="main-menu__item main-menu__welcome">
                            Welcome, {session.user?.name || "Mystic One"}
                        </li>
                        <li className="main-menu__item">
                            <button
                                className="btn main-menu__link"
                                onClick={() => signOut({ callbackUrl: "/" })}
                            >
                                Slip Into the Shadows
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