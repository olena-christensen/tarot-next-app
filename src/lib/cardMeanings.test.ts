import { describe, expect, it } from "vitest";
import { tarots } from "@/data";
import { CARD_MEANINGS } from "./cardMeanings";

/**
 * These slugs are indexed URLs. A slug that changes is a 404 and a lost ranking,
 * so the frozen list below is the contract — if a test here fails, the fix is
 * almost never to update the expectation.
 */
const EXPECTED_SLUGS = [
  "the-fool",
  "the-magician",
  "the-high-priestess",
  "the-empress",
  "the-emperor",
  "the-hierophant",
  "the-lovers",
  "the-chariot",
  "justice",
  "the-hermit",
  "wheel-of-fortune",
  "strength",
  "the-hanged-man",
  "death",
  "temperance",
  "the-devil",
  "the-tower",
  "the-star",
  "the-moon",
  "the-sun",
  "judgement",
  "the-world",
  "ace-of-cups",
  "two-of-cups",
  "three-of-cups",
  "four-of-cups",
  "five-of-cups",
  "six-of-cups",
  "seven-of-cups",
  "eight-of-cups",
  "nine-of-cups",
  "ten-of-cups",
  "page-of-cups",
  "knight-of-cups",
  "queen-of-cups",
  "king-of-cups",
  "ace-of-swords",
  "two-of-swords",
  "three-of-swords",
  "four-of-swords",
  "five-of-swords",
  "six-of-swords",
  "seven-of-swords",
  "eight-of-swords",
  "nine-of-swords",
  "ten-of-swords",
  "page-of-swords",
  "knight-of-swords",
  "queen-of-swords",
  "king-of-swords",
  "ace-of-pentacles",
  "two-of-pentacles",
  "three-of-pentacles",
  "four-of-pentacles",
  "five-of-pentacles",
  "six-of-pentacles",
  "seven-of-pentacles",
  "eight-of-pentacles",
  "nine-of-pentacles",
  "ten-of-pentacles",
  "page-of-pentacles",
  "knight-of-pentacles",
  "queen-of-pentacles",
  "king-of-pentacles",
  "ace-of-wands",
  "two-of-wands",
  "three-of-wands",
  "four-of-wands",
  "five-of-wands",
  "six-of-wands",
  "seven-of-wands",
  "eight-of-wands",
  "nine-of-wands",
  "ten-of-wands",
  "page-of-wands",
  "knight-of-wands",
  "queen-of-wands",
  "king-of-wands",
];

describe("card meaning slugs", () => {
  it("covers all 78 cards", () => {
    expect(CARD_MEANINGS).toHaveLength(78);
    expect(tarots).toHaveLength(78);
  });

  it("is exactly one entry per card in src/data.ts, in the same order", () => {
    expect(CARD_MEANINGS.map((c) => c.id)).toEqual(tarots.map((c) => c.id));
  });

  it("has 78 unique slugs", () => {
    const slugs = CARD_MEANINGS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(78);
  });

  it("matches the frozen slug list — changing a slug breaks a live URL", () => {
    expect(CARD_MEANINGS.map((c) => c.slug)).toEqual(EXPECTED_SLUGS);
  });

  it("uses only lowercase, hyphen-separated slugs", () => {
    for (const { slug } of CARD_MEANINGS) {
      expect(slug).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    }
  });
});

describe("card meaning content", () => {
  it("gives every card upright, reversed, correspondences and spread text", () => {
    for (const card of CARD_MEANINGS) {
      expect(card.title.length, card.slug).toBeGreaterThan(0);
      expect(card.upright.length, card.slug).toBeGreaterThan(80);
      expect(card.reversed.length, card.slug).toBeGreaterThan(80);
      expect(card.inSpread.length, card.slug).toBeGreaterThan(80);
      expect(card.correspondences.length, card.slug).toBeGreaterThanOrEqual(4);
      for (const row of card.correspondences) {
        expect(row.label.length, card.slug).toBeGreaterThan(0);
        expect(row.value.length, card.slug).toBeGreaterThan(0);
      }
    }
  });

  it("marks the 22 majors and gives them no suit", () => {
    const majors = CARD_MEANINGS.filter((c) => c.arcanum === "major");
    expect(majors).toHaveLength(22);
    for (const card of majors) {
      expect(card.suit, card.slug).toBeUndefined();
      // Papus describes the majors himself, so they carry no derivation note.
      expect(card.derivation, card.slug).toBeUndefined();
    }
  });

  it("states the derivation on all 56 minors and never on a major", () => {
    const minors = CARD_MEANINGS.filter((c) => c.arcanum === "minor");
    expect(minors).toHaveLength(56);
    for (const card of minors) {
      expect(card.suit, card.slug).toBeDefined();
      expect(card.derivation, card.slug).toContain(
        "Papus gives no separate description of this card"
      );
    }
  });

  it("keeps each minor's suit in step with the card it belongs to", () => {
    const suitById = new Map(
      tarots.map((c) => [c.id, "suite" in c ? c.suite : undefined])
    );
    for (const card of CARD_MEANINGS) {
      expect(card.suit, card.slug).toBe(suitById.get(card.id));
    }
  });
});
