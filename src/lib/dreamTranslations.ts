import { DREAMS, normalize, type DreamSymbol } from "@/lib/dreamMeanings";
import type { DreamTexts } from "@/lib/dreamTexts/types";
import { DREAM_TEXTS_UK } from "@/lib/dreamTexts/uk";
import { DREAM_TEXTS_RU } from "@/lib/dreamTexts/ru";
import { DREAM_TEXTS_TR } from "@/lib/dreamTexts/tr";
import { DREAM_TEXTS_NO } from "@/lib/dreamTexts/no";

/** English lives in dreamMeanings.ts; every other language is a table keyed by the English slug. */
const TEXTS: Record<string, DreamTexts> = {
  uk: DREAM_TEXTS_UK,
  ru: DREAM_TEXTS_RU,
  tr: DREAM_TEXTS_TR,
  no: DREAM_TEXTS_NO,
};

/** The dream with its words in the visitor's language (English when none exist). */
export function localizeDream(dream: DreamSymbol, locale: string): DreamSymbol {
  const text = TEXTS[locale]?.[dream.slug];
  if (!text) return dream;
  return {
    ...dream,
    title: text.title,
    short: text.short,
    paragraphs: [...text.paragraphs],
    // English words keep finding the dream in every language.
    terms: `${dream.terms} ${dream.title.toLowerCase()} ${normalize(text.title)}`,
  };
}

/** Every dream in this language, A to Z by its local name. */
export function getLocalizedDreams(locale: string): DreamSymbol[] {
  return DREAMS.map((dream) => localizeDream(dream, locale)).sort((a, b) =>
    a.title.localeCompare(b.title, locale)
  );
}

export function getAdjacentLocalized(
  slug: string,
  locale: string
): { previous: DreamSymbol | null; next: DreamSymbol | null } {
  const list = getLocalizedDreams(locale);
  const index = list.findIndex((dream) => dream.slug === slug);
  return {
    previous: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}

export function groupLocalizedByLetter(
  locale: string
): { letter: string; dreams: DreamSymbol[] }[] {
  const groups = new Map<string, DreamSymbol[]>();
  for (const dream of getLocalizedDreams(locale)) {
    const letter = dream.title.charAt(0).toLocaleUpperCase(locale);
    groups.set(letter, [...(groups.get(letter) ?? []), dream]);
  }
  return [...groups.entries()].map(([letter, dreams]) => ({ letter, dreams }));
}
