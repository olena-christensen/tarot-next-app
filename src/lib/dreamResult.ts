import type { DreamSymbol } from "@/lib/dreamMeanings";

/** "Water and falling" (sentence case, list joined in the visitor's language). */
export function symbolsLabel(dreams: DreamSymbol[], locale: string): string {
  const names = dreams.map((dream) => dream.title.toLocaleLowerCase(locale));
  const joined = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(names);
  return joined.charAt(0).toLocaleUpperCase(locale) + joined.slice(1);
}

/** Lower-case version, for "I dreamed of water and falling". */
export function symbolsPhrase(dreams: DreamSymbol[], locale: string): string {
  return symbolsLabel(dreams, locale).toLocaleLowerCase(locale);
}

export function firstSentence(text: string, max = 220): string {
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}
