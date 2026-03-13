import Logo from "@/components/Logo";
import MainMenu from "@/components/MainMenu";

type HeaderProps = {
    onOpenLogin: () => void;
};

export const Header = ({onOpenLogin}: HeaderProps) => {
    return (
        <header className="main-header container">
            <Logo />
            <MainMenu onOpenLogin={onOpenLogin} />
        </header>
    );
};
