// Reader registry. Mirrors the structure of decks.ts.
//
// Each reader is a "host" persona for the reading. Their display strings
// (name, title, tagline, bio) and voice templates live in
// messages/{lang}/readings.json under "readers.{id}". This file is the
// structural registry only — id, aura color, optional avatar path.
//
// To add a reader:
//   1. Add an entry below.
//   2. Add the matching block to messages/{lang}/readings.json.
//   3. The selection UI and reading generator pick it up automatically.

export const READERS = {
  vespera:  { id: "vespera",  aura: "#7a1f3d", avatar: "/readers/vespera.webp" },
  crow:     { id: "crow",     aura: "#c8c4b8", avatar: "/readers/crow.webp" },
  reginald: { id: "reginald", aura: "#6b7a3d", avatar: "/readers/reginald.webp" },
} as const;

export type ReaderId = keyof typeof READERS;
export const READER_IDS = Object.keys(READERS) as ReaderId[];
export const DEFAULT_READER: ReaderId = "vespera";

export function isReaderId(value: string | null | undefined): value is ReaderId {
  return !!value && value in READERS;
}
