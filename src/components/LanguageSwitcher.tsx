"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import GlobeIcon from "@/assets/svg/globe.svg";
import ChevronDown from "@/assets/svg/chevron-down.svg";

const localeNames: Record<string, string> = {
  en: "English",
  no: "Norsk",
  ru: "Русский",
};

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
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

  const handleSelect = (loc: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: loc });
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
