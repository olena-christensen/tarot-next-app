"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import MainMenu from "@/components/MainMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderAvatar } from "@/components/HeaderAvatar";
import { HeaderGreeting } from "@/components/HeaderGreeting";

let hasPlayedHeaderIntro = false;

type HeaderProps = {
    onOpenLogin: () => void;
};

export const Header = ({onOpenLogin}: HeaderProps) => {
    // Gate on session?.user, never on status: a NextAuth update() flips status
    // to "loading" mid-flight and would unmount LanguageSwitcher along with its
    // open modal. Session data survives an update(), so this doesn't.
    const { data: session } = useSession();
    const [skipIntro] = useState(() => {
        // SSR must be deterministic and match a fresh client load (intro plays).
        // Never read/mutate the module flag on the server — it persists across
        // requests and would desync server vs. client HTML (hydration mismatch).
        if (typeof window === "undefined") return false;
        const skip = hasPlayedHeaderIntro;
        hasPlayedHeaderIntro = true;
        return skip;
    });

    return (
        <>
            {/* Mobile only, and deliberately OUTSIDE <header>: .main-header is
                animated with a transform, which would make it the containing
                block for a position:fixed child. Hidden at md+, where the nav
                row has space for the greeting inline. */}
            <HeaderGreeting className="header-greeting--bar" />
            <header
                className={`main-header container${skipIntro ? " skip-intro" : ""}${
                    session?.user ? " main-header--greeted" : ""
                }`}
            >
                <Logo />
                <MainMenu onOpenLogin={onOpenLogin} />
                {session?.user ? <HeaderAvatar /> : <LanguageSwitcher />}
            </header>
        </>
    );
};
