/** One dream symbol's words in one language. Keys are the English slugs. */
export type DreamText = {
  title: string;
  short: string;
  paragraphs: [string, string];
};

export type DreamTexts = Record<string, DreamText>;
