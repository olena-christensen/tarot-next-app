"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import GlobeIcon from "@/assets/svg/globe.svg";
import ChevronDown from "@/assets/svg/chevron-down.svg";

const localeNames: Record<string, string> = {
  en: "English",
  no: "Norsk",
  ru: "Русский",
  uk: "Українська",
  tr: "Türkçe",
};

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (loc: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: loc });

    if (session?.user?.id) {
      try {
        const res = await fetch("/api/user/locale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: loc }),
        });
        if (res.ok) {
          await updateSession({ preferredLocale: loc });
        }
      } catch {
        // Non-critical — URL change still takes effect for this session.
      }
    }
  };

  return (
    <div className="language-switcher" ref={ref}>
      <button
        className="language-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Language"
      >
        <GlobeIcon />
        <ChevronDown />
      </button>
      {isOpen && (
        <ul className="language-switcher__dropdown">
          {routing.locales.map((loc) => (
            <li key={loc}>
              <button
                className={`language-switcher__option${loc === locale ? " language-switcher__option--active" : ""}`}
                onClick={() => handleSelect(loc)}
              >
                {localeNames[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
