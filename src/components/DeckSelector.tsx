"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { DECKS, DECK_IDS, DEFAULT_DECK, type DeckId } from "@/lib/decks";

const DECK_NAME_KEYS: Record<DeckId, string> = {
  "Rider-Waite": "deckRiderWaite",
  "Klimt": "deckKlimt",
  "Gothic-Vintage": "deckGothicVintage",
};

export const DeckSelector = ({ inModal = false }: { inModal?: boolean } = {}) => {
  const { data: session, update } = useSession();
  const t = useTranslations("ui");
  const [currentDeck, setCurrentDeck] = useState<string>(DEFAULT_DECK);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/user/deck")
      .then((res) => res.json())
      .then((data) => setCurrentDeck(data.deck ?? DEFAULT_DECK))
      .catch(() => {});
  }, [session]);

  const handleSelect = async (deckId: DeckId) => {
    if (deckId === currentDeck || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/deck", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: deckId }),
      });
      if (res.ok) {
        setCurrentDeck(deckId);
        await update({ preferredDeck: deckId });
      }
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  };

  const grid = (
    <>
      <div className="decks__grid">
        {DECK_IDS.map((id) => {
          const deck = DECKS[id];
          const isSelected = id === currentDeck;
          const cardClass = isSelected
            ? "decks__card decks__card--selected"
            : "decks__card";

          // The chosen deck is marked by the gold bead on the card's top border
          // (see _decks.scss) — the app-wide "this one" marker. The CTA below
          // still says so in words for anyone who can't see it.
          return (
            <article key={id} className={cardClass}>
              <Image
                className="decks__preview"
                src={deck.preview}
                alt={t(DECK_NAME_KEYS[id])}
                width={160}
                height={280}
              />
              <h2 className="decks__card-name">{t(DECK_NAME_KEYS[id])}</h2>
              {session ? (
                <button
                  type="button"
                  className="decks__cta"
                  disabled={isSelected || isSaving}
                  onClick={() => handleSelect(id)}
                >
                  {isSelected ? t("selected") : t("selectDeck")}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      {!session && (
        <p className="decks__sign-in-prompt">{t("signInToSelectDeck")}</p>
      )}
    </>
  );

  // In a modal, skip the page chrome (section / container / page title) — the
  // Modal supplies its own frame and title.
  if (inModal) {
    return <div className="decks decks--modal">{grid}</div>;
  }

  return (
    <section className="decks">
      <div className="container">
        <header className="decks__header">
          <h1 className="decks__title">{t("chooseDeck")}</h1>
        </header>
        {grid}
      </div>
    </section>
  );
};
