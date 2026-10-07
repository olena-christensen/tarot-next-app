import type { Correspondence } from "@/lib/cardMeanings";

/** One card's reading in another language. Names come from messages/{locale}/cards.json. */
export type CardText = {
  upright: string;
  reversed: string;
  inSpread: string;
  correspondences: Correspondence[];
  /** Minors only, as in the English. */
  derivation?: string;
};

export type CardTextTable = Partial<Record<string, CardText>>;
