import { describe, expect, it } from "vitest";
import {
  DREAMS,
  MAX_SYMBOLS,
  POPULAR_SLUGS,
  getAdjacentDreams,
  getDream,
  matchDreams,
  parseSymbolCode,
} from "./dreamMeanings";

describe("dreamMeanings", () => {
  it("has unique slugs, each with a meaning", () => {
    const slugs = DREAMS.map((dream) => dream.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const dream of DREAMS) {
      expect(dream.short.length).toBeGreaterThan(20);
      expect(dream.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it("only lists popular dreams that exist", () => {
    for (const slug of POPULAR_SLUGS) expect(getDream(slug)).toBeDefined();
  });

  it("finds a dream by a related word", () => {
    expect(matchDreams(DREAMS, "serpent").map((d) => d.slug)).toContain("snake");
    expect(matchDreams(DREAMS, "Chas").map((d) => d.slug)).toContain("being-chased");
  });

  it("parses a result link and rejects bad ones", () => {
    expect(parseSymbolCode("water_falling")?.map((d) => d.slug)).toEqual(["water", "falling"]);
    expect(parseSymbolCode("water_water")).toBeNull();
    expect(parseSymbolCode("nonsense")).toBeNull();
    const tooMany = DREAMS.slice(0, MAX_SYMBOLS + 1).map((d) => d.slug).join("_");
    expect(parseSymbolCode(tooMany)).toBeNull();
  });

  it("gives neighbours in A to Z order", () => {
    const { previous, next } = getAdjacentDreams("car");
    expect(previous?.title).toBe("Bridge");
    expect(next?.title).toBe("Cat");
  });
});
