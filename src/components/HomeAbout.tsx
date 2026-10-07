"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * "What lies beyond the Veil?" — the main page's words for search engines and
 * for curious visitors (Lena, 2026-10-07).
 *
 * The main page is otherwise almost wordless (the deck and readers are drawn in
 * the browser), so Google saw a near-empty page. This block is rendered on the
 * server, so its text is in the page from the first byte; it is only folded away
 * until the visitor opens it. The first screen stays exactly as designed: the
 * toggle sits under the game pill, the text unfolds below the fold.
 */

export const HOME_ABOUT_ID = "beyond-the-veil";
const TOGGLE_EVENT = "veil:about-toggle";
const STATE_EVENT = "veil:about-state";

/** The line under the game pill. */
export const HomeAboutToggle = () => {
  const t = useTranslations("homeAbout");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onState = (e: Event) => setOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener(STATE_EVENT, onState);
    return () => window.removeEventListener(STATE_EVENT, onState);
  }, []);

  return (
    <button
      type="button"
      className={`home-about-toggle${open ? " home-about-toggle--open" : ""}`}
      aria-expanded={open}
      aria-controls={HOME_ABOUT_ID}
      onClick={() => window.dispatchEvent(new Event(TOGGLE_EVENT))}
    >
      {t("toggle")}
      <span className="home-about-toggle__chevron" aria-hidden="true">
        ⌄
      </span>
    </button>
  );
};

/** The folded text, under the first screen. */
export const HomeAbout = () => {
  const t = useTranslations("homeAbout");
  const tReaders = useTranslations("readers");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const b = (chunks: React.ReactNode) => <b>{chunks}</b>;
  const i = (chunks: React.ReactNode) => <i>{chunks}</i>;

  useEffect(() => {
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener(TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(TOGGLE_EVENT, onToggle);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: open }));
    document.documentElement.classList.toggle("home-about-open", open);
    if (!open) return () => document.documentElement.classList.remove("home-about-open");

    // The first screen is a full screen tall and its content ends well above
    // its bottom, so the opened text is pulled up to start right under the
    // toggle instead of after an empty band.
    const section = ref.current;
    const pullUp = () => {
      const toggle = document.querySelector<HTMLElement>(".home-about-toggle");
      const block = document.querySelector<HTMLElement>(".offer-block");
      if (!section || !toggle || !block) return;
      const empty = block.getBoundingClientRect().bottom - toggle.getBoundingClientRect().bottom;
      section.style.marginTop = `${-Math.max(0, Math.round(empty))}px`;
    };
    pullUp();
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.addEventListener("resize", pullUp);
    return () => {
      window.removeEventListener("resize", pullUp);
      if (section) section.style.marginTop = "";
      document.documentElement.classList.remove("home-about-open");
    };
  }, [open]);

  // The fixed footer's height (its text, not its transparent top padding) —
  // the reader block sits exactly one gap above it (see _offer-block.scss).
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>(".main-footer--overlay");
    if (!footer) return;
    const root = document.documentElement;
    const measure = () => {
      const pad = parseFloat(getComputedStyle(footer).paddingTop) || 0;
      root.style.setProperty("--home-footer-h", `${Math.round(footer.offsetHeight - pad)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(footer);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--home-footer-h");
    };
  }, []);

  const reader = (id: "vespera" | "crow" | "reginald", key: string) => (
    <>
      <b>{tReaders(`${id}.displayName`)}</b>, {tReaders(`${id}.title`)} — {t(key)}
    </>
  );

  return (
    <section id={HOME_ABOUT_ID} ref={ref} className="home-about container" hidden={!open}>
      <h2 className="home-about__title title">{t("title")}</h2>
      <p className="home-about__intro">{t.rich("intro", { i })}</p>

      <section className="home-about__section">
        <h3 className="home-about__heading">{t("howTitle")}</h3>
        <p className="home-about__text">{t("howText")}</p>
      </section>

      <section className="home-about__section">
        <h3 className="home-about__heading">{t("positionsTitle")}</h3>
        <p className="home-about__text">{t.rich("positionsText", { b })}</p>
      </section>

      <section className="home-about__section">
        <h3 className="home-about__heading">{t("readersTitle")}</h3>
        <p className="home-about__text">
          {reader("vespera", "readerVespera")}. {reader("crow", "readerCrow")}.{" "}
          {reader("reginald", "readerReginald")}.
        </p>
      </section>

      <section className="home-about__section">
        <h3 className="home-about__heading">{t("faqTitle")}</h3>
        {(["Free", "Decks", "Future", "Cards"] as const).map((k) => (
          <details className="home-about__faq" key={k}>
            <summary className="home-about__question">{t(`faq${k}Q`)}</summary>
            <p className="home-about__text">{t(`faq${k}A`)}</p>
          </details>
        ))}
      </section>

      <p className="home-about__more">
        <Link href="/cards" className="home-about__link">
          {t("cardsLink")} →
        </Link>
      </p>
    </section>
  );
};
