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
