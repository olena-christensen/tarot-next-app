"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { READERS, READER_IDS, DEFAULT_READER, type ReaderId } from "@/lib/readers";
import { MysticButton } from "@/components/MysticButton";

interface ReaderSelectionProps {
  /** Commit a reader AND close the modal (the Summon button). */
  onSelect: (readerId: ReaderId) => void;
  /** Choose a reader WITHOUT closing the modal (clicking a card). */
  onChoose: (readerId: ReaderId) => void;
  /** Currently active reader — shown with a visual indicator. */
  currentReader: ReaderId;
  /** Whether the user has a paid subscription (unlocks non-default readers). */
  isSubscriber: boolean;
  /** Called when a locked reader's summon is clicked — routes to the subscription page. */
  onOpenSubscription: () => void;
}

/**
 * Reader selection step. Shown after the user opens the reading flow but
 * before any cards are drawn. Two-stage interaction: hover/focus reveals
 * the reader's bio + summon CTA, clicking summon commits the choice.
 *
 * The focused reader's aura color flows into the page via --reader-accent,
 * theming borders, glows, and the CTA. Each card also carries its own
 * --card-accent (resting tint) regardless of focus.
 */
export const ReaderSelection = ({
  onSelect,
  onChoose,
  currentReader,
  isSubscriber,
  onOpenSubscription,
}: ReaderSelectionProps) => {
  const t = useTranslations("ui");
  // Reader copy lives in messages/{lang}/readings.json under "readers.{id}".
  const tReader = useTranslations("readers");
  const [focused, setFocused] = useState<ReaderId | null>(null);
  // Mobile only: the summon pane is a fixed bottom sheet. Scrolling the card
  // list dismisses it; tapping a reader brings it back. Desktop (inline pane)
  // is unaffected — the listener is gated to the sheet breakpoint.
  const [sheetDismissed, setSheetDismissed] = useState(false);
  // Below md the pane is a fixed bottom sheet. It must be portaled to <body>:
  // its ancestor .modal__content has backdrop-filter, which traps position:fixed
  // in a local containing block so the sheet scrolls with the cards instead of
  // nailing to the viewport. Portaling escapes that (same reason Modal portals).
  const [isSheet, setIsSheet] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 48em)");
    const sync = () => setIsSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const scroller = sectionRef.current?.closest(".modal__content");
    if (!scroller) return;
    const onScroll = () => {
      if (isSheet) setSheetDismissed(true);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [isSheet]);

  const focusedReader = focused ? READERS[focused] : null;
  const paneAccent = focusedReader
    ? ({ "--reader-accent": focusedReader.aura } as CSSProperties)
    : undefined;

  const isLocked = (id: ReaderId) =>
    id !== DEFAULT_READER && !isSubscriber;

  // Summon button: locked → subscription; else choose AND close the modal.
  const handleSummon = () => {
    if (!focused) return;
    if (isLocked(focused)) {
      onOpenSubscription();
    } else {
      onSelect(focused);
    }
  };

  // Clicking a card moves the focus glow to it and chooses that reader, but
  // keeps the modal open — the Summon button is the one that closes. Locked
  // readers route to the subscription flow instead.
  const handleCardClick = (id: ReaderId) => {
    if (isLocked(id)) {
      onOpenSubscription();
      return;
    }
    setFocused(id);
    setSheetDismissed(false); // re-show the sheet on a fresh pick
    onChoose(id);
  };

  // Bio + Summon. Rendered inline in the modal on desktop; on mobile it's the
  // fixed bottom sheet, portaled to <body> so it clears .modal__content's
  // backdrop-filter containing block and nails to the real viewport bottom.
  const summonPane = (
    <div
      className="reader-selection__summon-pane"
      aria-live="polite"
      data-visible={focusedReader && !sheetDismissed ? "true" : "false"}
      style={paneAccent}
    >
      {/* Every reader's bio + the resting placeholder share one grid cell, so
          the box is always as tall as the tallest of them — the pane (and the
          modal around it) never reflows when switching readers. Only the active
          one is shown. */}
      <div className="reader-selection__bio-stack">
        {READER_IDS.map((id) => (
          <p
            key={id}
            className="reader-selection__bio"
            data-active={focused === id ? "true" : "false"}
            aria-hidden={focused === id ? undefined : "true"}
          >
            {tReader(`${id}.bio`)}
          </p>
        ))}
        <p
          className="reader-selection__placeholder"
          data-active={focused ? "false" : "true"}
          aria-hidden={focused ? "true" : undefined}
        >
          {t("hoverToLearn")}
        </p>
      </div>
      {focusedReader && (
        <MysticButton type="button" onClick={handleSummon}>
          {/* Every possible summon label overlaps in one cell so the button
              reserves the widest — its width stays constant across readers,
              only the active label is shown. */}
          <span className="reader-selection__summon-label-stack">
            {READER_IDS.map((id) => {
              const active = !isLocked(focused!) && focused === id;
              return (
                <span
                  key={id}
                  data-active={active ? "true" : "false"}
                  aria-hidden={active ? undefined : "true"}
                >
                  {t("summonReader", { name: tReader(`${id}.displayName`) })}
                </span>
              );
            })}
            <span
              data-active={isLocked(focused!) ? "true" : "false"}
              aria-hidden={isLocked(focused!) ? undefined : "true"}
            >
              {t("beginInitiation")}
            </span>
          </span>
        </MysticButton>
      )}
    </div>
  );

  const section = (
    <section
      ref={sectionRef}
      className="reader-selection"
      style={
        focusedReader
          ? ({ "--reader-accent": focusedReader.aura } as CSSProperties)
          : undefined
      }
      data-has-focus={focusedReader ? "true" : "false"}
    >
      <div
        className="reader-selection__deck"
        role="radiogroup"
        aria-label={t("chooseYourReader")}
      >
        {READER_IDS.map((id) => {
          const reader = READERS[id];
          const isFocused = focused === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isFocused}
              className={[
                "reader-selection__card",
                isFocused ? "reader-selection__card--focused" : "",
                id === currentReader ? "reader-selection__card--current" : "",
                isLocked(id) ? "reader-selection__card--locked" : "",
              ].filter(Boolean).join(" ")}
              onMouseEnter={() => setFocused(id)}
              onFocus={() => setFocused(id)}
              onClick={() => handleCardClick(id)}
              style={{ "--card-accent": reader.aura } as CSSProperties}
            >
              {isLocked(id) && (
                <span
                  className="reader-selection__lock-badge"
                  aria-hidden="true"
                >
                  ★
                </span>
              )}
              <div className="reader-selection__card-inner">
                <div className="reader-selection__portrait" aria-hidden="true">
                  <Image
                    src={reader.avatar}
                    alt={tReader(`${id}.displayName`)}
                    width={88}
                    height={88}
                    className="reader-selection__portrait-image"
                  />
                </div>

                <div className="reader-selection__meta">
                  <p className="reader-selection__card-title">
                    {tReader(`${id}.title`)}
                  </p>
                  <h2 className="reader-selection__card-name">
                    {tReader(`${id}.displayName`)}
                  </h2>
                </div>

                <p className="reader-selection__card-tagline">
                  &ldquo;{tReader(`${id}.tagline`)}&rdquo;
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {!isSheet && summonPane}
    </section>
  );

  return (
    <>
      {section}
      {isSheet && typeof document !== "undefined"
        ? createPortal(summonPane, document.body)
        : null}
    </>
  );
};
