import Image from "next/image";
import { Link } from "@/i18n/navigation";

export default function Logo() {
    return (
        <Link href="/" className="logo">
            <Image src="/logo-2.png" alt="The Veil" width={500} height={259} priority />
        </Link>
    );
};
