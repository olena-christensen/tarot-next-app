import Link from "next/link";
import LogoImg from "../assets/svg/logo.svg";
export default function Logo() {
    return (
        <Link href="/" className="logo">
            <LogoImg />
        </Link>
    );
};
