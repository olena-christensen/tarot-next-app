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
  "magicFlower",
  "fairyDust",
  "deadFinger",
  "creatureClaw",
  "trollEar",
  "lizard",
  "butterflyWing",
  "snowflake",
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
/** The sand clock: find everything before the potion boils over (Lena, 2026-10-06). */
export const ROUND_TIME_MS = 80_000; // 1:20 (was 1:30 until 2026-10-07)
/** The last stretch: the clock turns red and the cauldron bubbles harder. */
export const ROUND_WARN_MS = 20_000;
/** Potions in one (Kyiv) day that earn a moonstone — see reward.ts. */
export const POTIONS_PER_MOONSTONE = 3;
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

// ---------- the brewed potion ----------

/** The potion is named after the recipe's main ingredient (the ×3 line). */
export function potionOf(recipe: RecipeLine[]): IngredientId {
  return recipe.reduce((a, b) => (b.count > a.count ? b : a)).ingredient;
}

export const BREWER_NAME_MAX = 24;

/** First name only, trimmed, no control characters — it travels in a public link. */
export function cleanBrewerName(raw: string | null | undefined): string | null {
  const first = (raw ?? "").trim().split(/\s+/)[0] ?? "";
  // eslint-disable-next-line no-control-regex
  const safe = first.replace(/[\u0000-\u001f\u007f<>]/g, "").slice(0, BREWER_NAME_MAX);
  return safe || null;
}

/** `round`: the server round behind a real gift (see reward.ts); absent in old links. */
export type PotionGift = { potion: IngredientId; from: string | null; round?: string | null };

function toBase64Url(s: string): string {
  const b64 =
    typeof window === "undefined"
      ? Buffer.from(s, "utf8").toString("base64")
      : btoa(String.fromCharCode(...Array.from(new TextEncoder().encode(s))));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof window === "undefined") return Buffer.from(b64, "base64").toString("utf8");
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/**
 * A shared potion is encoded entirely in its link — no database row, nothing to
 * clean up. The code is not a secret: it only says which potion and who brewed it.
 */
export function encodeGift(gift: PotionGift): string {
  // `r` makes every brew's link unique. Without it the same potion from the
  // same person is always the same address, and Slack/Messenger/Facebook keep
  // showing whatever preview they cached for it first — even after we change
  // the preview. decodeGift ignores it.
  const r = Math.random().toString(36).slice(2, 7);
  return toBase64Url(
    JSON.stringify({ p: gift.potion, n: gift.from ?? "", r, ...(gift.round ? { g: gift.round } : {}) }),
  );
}

export function decodeGift(code: string): PotionGift | null {
  try {
    if (code.length > 300) return null;
    const raw = JSON.parse(fromBase64Url(code));
    if (!INGREDIENT_IDS.includes(raw?.p)) return null;
    const round = typeof raw.g === "string" && /^[a-z0-9]{10,40}$/.test(raw.g) ? raw.g : null;
    return { potion: raw.p, from: cleanBrewerName(typeof raw.n === "string" ? raw.n : null), round };
  } catch {
    return null;
  }
}
