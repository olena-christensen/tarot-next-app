"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { READERS, READER_IDS, DEFAULT_READER, type ReaderId } from "@/lib/readers";
import { MysticButton } from "@/components/MysticButton";

interface ReaderSelectionProps {
  /** Called when the user commits to a reader. */
  onSelect: (readerId: ReaderId) => void;
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
  currentReader,
  isSubscriber,
  onOpenSubscription,
}: ReaderSelectionProps) => {
  const t = useTranslations("ui");
  // Reader copy lives in messages/{lang}/readings.json under "readers.{id}".
  const tReader = useTranslations("readers");
  const [focused, setFocused] = useState<ReaderId | null>(null);

  const focusedReader = focused ? READERS[focused] : null;

  const isLocked = (id: ReaderId) =>
    id !== DEFAULT_READER && !isSubscriber;

  const handleSummon = () => {
    if (!focused) return;
    if (isLocked(focused)) {
      onOpenSubscription();
    } else {
      onSelect(focused);
    }
  };

  return (
    <section
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
              onClick={() => setFocused(id)}
              style={{ "--card-accent": reader.aura } as CSSProperties}
            >
              <div className="reader-selection__card-inner">
                <div className="reader-selection__portrait" aria-hidden="true">
                  {/* Placeholder until avatars exist at /readers/{id}.webp */}
                  <span className="reader-selection__portrait-initial">
                    {tReader(`${id}.displayName`).charAt(0)}
                  </span>
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

      <div
        className="reader-selection__summon-pane"
        aria-live="polite"
        data-visible={focusedReader ? "true" : "false"}
      >
        {focusedReader ? (
          <>
            <p className="reader-selection__bio">
              {tReader(`${focused}.bio`)}
            </p>
            <MysticButton
              type="button"
              onClick={handleSummon}
            >
              {isLocked(focused!)
                ? t("beginInitiation")
                : t("summonReader", { name: tReader(`${focused}.displayName`) })}
            </MysticButton>
          </>
        ) : (
          <p className="reader-selection__placeholder">{t("hoverToLearn")}</p>
        )}
      </div>
    </section>
  );
};
