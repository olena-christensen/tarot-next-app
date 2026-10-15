"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link as IntlLink, usePathname } from "@/i18n/navigation";
import MenuIcon from "@/assets/svg/menu.svg";
import MenuCloseIcon from "@/assets/svg/menu-close.svg";

type HeaderNavMenuProps = {
    /** Lets the header lift itself above the overlay footer while the phone panel covers the page. */
    onOpenChange: (open: boolean) => void;
};

const PANEL_ID = "header-nav-panel";

/**
 * The site menu: a button that opens a panel. Below `md` the panel is a
 * full-width list under the header covering the page; from `md` up it is a
 * small panel under the button, right-aligned.
 *
 * The panel is positioned absolutely, never `fixed` — `.main-header` carries a
 * transform during the intro, which would trap a fixed child.
 */
export const HeaderNavMenu = ({ onOpenChange }: HeaderNavMenuProps) => {
    const { data: session } = useSession();
    const t = useTranslations("ui");
    const tCards = useTranslations("cardMeanings");
    const tDreams = useTranslations("dreams");
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [panelTop, setPanelTop] = useState(0);
    const wrapRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const setOpen = useCallback(
        (open: boolean) => {
            setIsOpen(open);
            onOpenChange(open);
        },
        [onOpenChange]
    );

    // Route change closes it.
    useEffect(() => {
        setOpen(false);
    }, [pathname, setOpen]);

    useEffect(() => {
        if (!isOpen) return;

        // The phone panel fills the screen from the header's bottom edge down.
        const measure = () => {
            const header = wrapRef.current?.closest(".main-header");
            setPanelTop(Math.max(0, header?.getBoundingClientRect().bottom ?? 0));
        };
        measure();

        // Phone panel only: hold the page still, or a swipe scrolls the page
        // and slides the panel (attached to the absolute header) off-screen.
        const root = document.documentElement;
        const lock = window.matchMedia("(max-width: 48em)").matches;
        if (lock) root.classList.add("header-nav-locked");

        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            setOpen(false);
            buttonRef.current?.focus();
        };
        const onPointer = (e: PointerEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };

        window.addEventListener("resize", measure);
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            window.removeEventListener("resize", measure);
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onPointer);
            if (lock) root.classList.remove("header-nav-locked");
        };
    }, [isOpen, setOpen]);

    const close = () => setOpen(false);
    const label = isOpen ? t("menuClose") : t("menuOpen");

    return (
        <div className="header-nav" ref={wrapRef}>
            {/* No tip while open — it would sit on top of the panel. */}
            <span className="header-tip" data-tip={isOpen ? undefined : label}>
                <button
                    ref={buttonRef}
                    type="button"
                    className={`header-icon${isOpen ? " header-icon--active" : ""}`}
                    aria-expanded={isOpen}
                    aria-controls={PANEL_ID}
                    aria-label={label}
                    onClick={() => setOpen(!isOpen)}
                >
                    {isOpen ? <MenuCloseIcon aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
                </button>
            </span>
            {isOpen && (
                <nav
                    id={PANEL_ID}
                    className="header-nav__panel"
                    aria-label={t("menuLabel")}
                    style={{ "--header-nav-top": `${panelTop}px` } as CSSProperties}
                >
                    <ul className="header-nav__list">
                        <li><IntlLink className="header-nav__link" href="/" onClick={close}>{t("menuReadCards")}</IntlLink></li>
                        <li><IntlLink className="header-nav__link" href="/cards" onClick={close}>{tCards("navLabel")}</IntlLink></li>
                        <li><IntlLink className="header-nav__link" href="/dreams/tell" onClick={close}>{tDreams("menuDreams")}<span className="header-nav__tag">{tDreams("menuNew")}</span></IntlLink></li>
                        <li><IntlLink className="header-nav__link" href="/dreams" onClick={close}>{tDreams("footerLink")}</IntlLink></li>
                        <li><IntlLink className="header-nav__link" href="/game" onClick={close}>{t("menuGames")}</IntlLink></li>
                        <li><IntlLink className="header-nav__link" href="/decks" onClick={close}>{t("menuDecks")}</IntlLink></li>
                        <li><IntlLink className="header-nav__link" href="/subscription" onClick={close}>{t("menuSubscription")}</IntlLink></li>
                        {session?.user && (
                            <>
                                <li><IntlLink className="header-nav__link" href="/history" onClick={close}>{t("menuMyReadings")}</IntlLink></li>
                                <li><IntlLink className="header-nav__link" href="/profile" onClick={close}>{t("menuMyProfile")}</IntlLink></li>
                            </>
                        )}
                        {/* Phone only — the footer carries these on every screen too.
                            Legal pages are unprefixed, so plain next/link. */}
                        <li className="header-nav__item--phone"><IntlLink className="header-nav__link" href="/contact" onClick={close}>{t("contact")}</IntlLink></li>
                        <li className="header-nav__item--phone"><NextLink className="header-nav__link" href="/terms" onClick={close}>{t("termsOfService")}</NextLink></li>
                        <li className="header-nav__item--phone"><NextLink className="header-nav__link" href="/privacy" onClick={close}>{t("privacyPolicy")}</NextLink></li>
                        <li className="header-nav__item--phone"><NextLink className="header-nav__link" href="/cookie-policy" onClick={close}>{t("cookiePolicy")}</NextLink></li>
                        <li className="header-nav__item--phone"><NextLink className="header-nav__link" href="/refund" onClick={close}>{t("refundPolicy")}</NextLink></li>
                    </ul>
                </nav>
            )}
        </div>
    );
};
