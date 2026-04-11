import Logo from "@/components/Logo";
import MainMenu from "@/components/MainMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type HeaderProps = {
    onOpenLogin: () => void;
    onOpenProfile: () => void;
};

export const Header = ({onOpenLogin, onOpenProfile}: HeaderProps) => {
    return (
        <header className="main-header container">
            <Logo />
            <MainMenu onOpenLogin={onOpenLogin} onOpenProfile={onOpenProfile} />
            <LanguageSwitcher />
        </header>
    );
};
