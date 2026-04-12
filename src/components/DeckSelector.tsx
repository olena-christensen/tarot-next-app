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

export const DeckSelector = () => {
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

  return (
    <section className="decks">
      <div className="container">
        <header className="decks__header">
          <h1 className="decks__title">{t("chooseDeck")}</h1>
        </header>

        <div className="decks__grid">
          {DECK_IDS.map((id) => {
            const deck = DECKS[id];
            const isSelected = id === currentDeck;
            const cardClass = isSelected
              ? "decks__card decks__card--selected"
              : "decks__card";

            return (
              <article key={id} className={cardClass}>
                {isSelected && (
                  <span className="decks__badge">{t("selected")}</span>
                )}
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
      </div>
    </section>
  );
};
