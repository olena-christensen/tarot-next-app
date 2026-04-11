import { Link } from "@/i18n/navigation";
import LogoImg from "../assets/svg/logo.svg";
export default function Logo() {
    return (
        <Link href="/" className="logo">
            <LogoImg />
        </Link>
    );
};
