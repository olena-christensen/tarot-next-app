export const DECKS = {
  "Rider-Waite": { id: "Rider-Waite", preview: "/Cards/Rider-Waite/MajorArcana/fool.webp" },
  "Klimt": { id: "Klimt", preview: "/Cards/Klimt/MajorArcana/fool.webp" },
  "Gothic-Vintage": { id: "Gothic-Vintage", preview: "/Cards/Gothic-Vintage/MajorArcana/fool.webp" },
} as const;

export type DeckId = keyof typeof DECKS;
export const DECK_IDS = Object.keys(DECKS) as DeckId[];
export const DEFAULT_DECK: DeckId = "Rider-Waite";

export function getCardImagePath(deck: string, cardImage: string): string {
  return `/Cards/${deck}${cardImage}`;
}
