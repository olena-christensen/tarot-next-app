"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import MainMenu from "@/components/MainMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAvatar } from "@/components/HeaderAvatar";
import { HeaderMoonstones } from "@/components/HeaderMoonstones";
import { HeaderGreeting } from "@/components/HeaderGreeting";
import { HeaderLogout } from "@/components/HeaderLogout";

type HeaderProps = {
    onOpenLogin: () => void;
};

export const Header = ({onOpenLogin}: HeaderProps) => {
    // Gate on session?.user, never on status: a NextAuth update() flips status
    // to "loading" mid-flight and would unmount LanguageSwitcher along with its
    // open modal. Session data survives an update(), so this doesn't.
    const { data: session } = useSession();
    // While the menu is open the header lifts above the overlay footer, which
    // would otherwise show through the phone panel.
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <>
            {/* Mobile only, and deliberately OUTSIDE <header>: .main-header is
                animated with a transform during the intro, which would make it the containing
                block for a position:fixed child. Hidden at md+, where the nav
                row has space for the greeting inline. */}
            <HeaderGreeting className="header-greeting--bar" />
            <header
                className={`main-header container${
                    session?.user ? " main-header--greeted" : ""
                }${isMenuOpen ? " main-header--menu-open" : ""}`}
            >
                <Logo />
                <MainMenu onOpenLogin={onOpenLogin} onMenuOpenChange={setIsMenuOpen} />
                {session?.user ? (
                    <>
                        <HeaderMoonstones onOpenLogin={onOpenLogin} />
                        <HeaderAvatar />
                        <HeaderLogout />
                    </>
                ) : (
                    <LanguageSwitcher />
                )}
            </header>
        </>
    );
};
