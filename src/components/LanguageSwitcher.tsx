"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Modal } from "@/components/Modal";
import GlobeIcon from "@/assets/svg/globe.svg";

const localeNames: Record<string, string> = {
  en: "English",
  no: "Norsk",
  ru: "Русский",
  uk: "Українська",
  tr: "Türkçe",
};

export const LanguageSwitcher = () => {
  const locale = useLocale();
  const t = useTranslations("ui");
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(locale);
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setSelected(locale);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (saving) return;
    if (selected === locale) {
      setIsOpen(false);
      return;
    }
    setSaving(true);

    // Persist the preference for signed-in users (best-effort); the URL change
    // below takes effect regardless.
    if (session?.user?.id) {
      try {
        const res = await fetch("/api/user/locale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: selected }),
        });
        if (res.ok) {
          await updateSession({ preferredLocale: selected });
        }
      } catch {
        // Non-critical — URL change still takes effect for this session.
      }
    }

    router.replace(pathname, { locale: selected });
    setSaving(false);
    setIsOpen(false);
  };

  return (
    <div className="language-switcher">
      <button
        className="language-switcher__trigger"
        onClick={handleOpen}
        aria-label={t("language")}
      >
        <GlobeIcon />
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t("language")}>
        <div className="options-modal">
          <ul className="options-modal__list list">
            {routing.locales.map((loc) => (
              <li key={loc} className="options-modal__item">
                <label className="options-modal__option">
                  <input
                    type="radio"
                    name="header-language"
                    className="options-modal__radio-input"
                    checked={selected === loc}
                    onChange={() => setSelected(loc)}
                    disabled={saving}
                  />
                  <span className="options-modal__radio" aria-hidden="true" />
                  <span className="options-modal__option-label">{localeNames[loc]}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="options-modal__save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </Modal>
    </div>
  );
};
