import type { CardMeaning } from "@/lib/cardMeanings";
import type { CardText, CardTextTable } from "./types";
import ru from "./ru";
import uk from "./uk";

const TABLES: Record<string, CardTextTable> = { uk, ru };

/** The card's reading in `locale`, or null when that card isn't translated yet. */
export function cardTextFor(card: CardMeaning, locale: string): CardText | null {
  return TABLES[locale]?.[card.id] ?? null;
}
