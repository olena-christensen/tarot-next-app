import { describe, expect, it } from "vitest";
import {
  INGREDIENT_IDS,
  RECIPE_SIZE,
  generateRound,
  hits,
  spotsFor,
} from "./index";

// Deterministic generator so failures reproduce.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe("potion game rounds", () => {
  it("every ingredient has at least 3 hiding spots (max count per recipe line)", () => {
    for (const id of INGREDIENT_IDS) expect(spotsFor(id).length).toBeGreaterThanOrEqual(3);
  });

  it("rounds are always valid: 3 distinct ingredients, counts 1-2-3, one thing per spot", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { recipe, placements } = generateRound(seeded(seed));
      expect(recipe).toHaveLength(RECIPE_SIZE);
      expect(new Set(recipe.map((r) => r.ingredient)).size).toBe(RECIPE_SIZE);
      expect(recipe.map((r) => r.count).sort()).toEqual([1, 2, 3]);
      expect(new Set(placements.map((p) => p.spot)).size).toBe(placements.length);
      for (const line of recipe) {
        expect(placements.filter((p) => p.ingredient === line.ingredient)).toHaveLength(line.count);
      }
    }
  });

  it("taps land inside the padded box only", () => {
    const { placements } = generateRound(seeded(7));
    const p = placements[0];
    const [x, y, w, h] = p.hit;
    expect(hits(p, x + w / 2, y + h / 2, 0)).toBe(true);
    expect(hits(p, x - 5, y, 6)).toBe(true);
    expect(hits(p, x - 20, y, 6)).toBe(false);
  });
});
