/**
 * "Brew the Potion" — the hidden-object game's rules, independent of React.
 *
 * Art and positions come from spots.generated.json, written by
 * scripts/build-potion-art.py. Each round picks a recipe of three ingredients
 * (counts 1, 2 and 3 in random order) and hides each copy in a different spot
 * of the room, never two things in one spot.
 */
import data from "./spots.generated.json";

export const INGREDIENT_IDS = [
  "batEye",
  "frogTongue",
  "dragonTear",
  "ravenFeather",
  "spider",
  "toadstool",
  "newtTail",
] as const;
export type IngredientId = (typeof INGREDIENT_IDS)[number];

export const WORLD = { width: data.width, height: data.height };
export const CAULDRON = data.cauldron;

type SpotArt = {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** [x, y, w, h] of the visible ingredient, for taps. */
  hit: number[];
};
type SpotTable = Record<string, Partial<Record<IngredientId, SpotArt>>>;
const SPOTS = data.spots as SpotTable;

export type Placement = SpotArt & { ingredient: IngredientId; spot: string };
export type RecipeLine = { ingredient: IngredientId; count: number };
export type Round = { recipe: RecipeLine[]; placements: Placement[] };

export const RECIPE_SIZE = 3;
const COUNTS = [1, 2, 3];

export function spritePath(id: IngredientId): string {
  return `/game-art/potion/sprites/${id}.webp`;
}

/** Spots an ingredient can be hidden in. */
export function spotsFor(id: IngredientId): string[] {
  return Object.keys(SPOTS).filter((spot) => SPOTS[spot][id]);
}

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Hide `need[i]` copies of each ingredient in distinct spots. Backtracking,
 * because ingredients compete for the same spots (the barrel takes a tongue,
 * a toadstool or a spider, but only one of them).
 */
function assignSpots(
  recipe: RecipeLine[],
  rand: () => number,
): Placement[] | null {
  const used = new Set<string>();
  const out: Placement[] = [];

  const place = (line: number, copy: number): boolean => {
    if (line === recipe.length) return true;
    const { ingredient, count } = recipe[line];
    if (copy === count) return place(line + 1, 0);
    for (const spot of shuffle(spotsFor(ingredient), rand)) {
      if (used.has(spot)) continue;
      used.add(spot);
      out.push({ ingredient, spot, ...(SPOTS[spot][ingredient] as SpotArt) });
      if (place(line, copy + 1)) return true;
      out.pop();
      used.delete(spot);
    }
    return false;
  };

  return place(0, 0) ? out : null;
}

export function generateRound(rand: () => number = Math.random): Round {
  for (let attempt = 0; attempt < 50; attempt++) {
    const ingredients = shuffle(INGREDIENT_IDS, rand).slice(0, RECIPE_SIZE);
    const counts = shuffle(COUNTS, rand);
    const recipe = ingredients.map((ingredient, i) => ({ ingredient, count: counts[i] }));
    const placements = assignSpots(recipe, rand);
    if (placements) return { recipe, placements };
  }
  throw new Error("potionGame: no feasible round — add hiding spots");
}

/** Is a world-space point on this placement? `pad` widens the box for fingers. */
export function hits(p: Placement, x: number, y: number, pad: number): boolean {
  const [hx, hy, hw, hh] = p.hit;
  return x >= hx - pad && x <= hx + hw + pad && y >= hy - pad && y <= hy + hh + pad;
}
