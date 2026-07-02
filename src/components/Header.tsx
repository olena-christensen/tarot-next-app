"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import MainMenu from "@/components/MainMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

let hasPlayedHeaderIntro = false;

type HeaderProps = {
    onOpenLogin: () => void;
};

export const Header = ({onOpenLogin}: HeaderProps) => {
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
        <header className={`main-header container${skipIntro ? " skip-intro" : ""}`}>
            <Logo />
            <MainMenu onOpenLogin={onOpenLogin} />
            <LanguageSwitcher />
        </header>
    );
};
