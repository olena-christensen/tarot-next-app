/**
 * "They Arrive at Midnight" — what can be bought, where it can go, and the wheel.
 *
 * Art for every item-in-place is pre-rendered by scripts/build-castle-art.py
 * (public/game-art/castle/patches/<item>--<place>.webp); its positions are in
 * places.generated.json. Prices are in moonstones (Lena, 2026-10-07/08).
 */

export type PlaceId =
  | "ceiling"
  | "wallLeft"
  | "wallBackLeft"
  | "wallBackCentre"
  | "wallBackRight"
  | "wallRight"
  | "shelf"
  | "mantel"
  | "tableCentre"
  | "cloth"
  | "settings"
  | "treatMiddle"
  | "treatFront"
  | "corner"
  | "fireplace";

export type TabId = "lights" | "walls" | "table" | "treats" | "fireMusic";

export type CatalogItem = {
  id: string;
  tab: TabId;
  /** Moonstones. Null: only the wheel gives it. */
  price: number | null;
  /** Where it can stand. Empty: owned, never placed (records). */
  places: PlaceId[];
  /** Placed by itself when bought (firewood lights the fire). */
  autoPlace?: PlaceId;
  /** Gives light (counts as "a light" for the party). */
  light?: boolean;
  /** A record: with a gramophone in the room, there is music. */
  record?: boolean;
  /** The wheel's rare prize pool. */
  rare?: boolean;
};

const WALL: PlaceId[] = ["wallLeft", "wallBackLeft", "wallBackCentre", "wallBackRight", "wallRight"];
const LEDGE: PlaceId[] = ["mantel", "shelf"];
const VASE: PlaceId[] = ["tableCentre", "mantel", "shelf"];
const TREAT: PlaceId[] = ["treatMiddle", "treatFront"];

export const CATALOG: CatalogItem[] = [
  // Lights
  { id: "chandelierIron", tab: "lights", price: 2, places: ["ceiling"], light: true },
  { id: "chandelierAntler", tab: "lights", price: 3, places: ["ceiling"], light: true },
  { id: "chandelierCrystal", tab: "lights", price: 4, places: ["ceiling"], light: true, rare: true },
  { id: "candelabraSilver", tab: "lights", price: 2, places: LEDGE, light: true },
  { id: "candelabraBlackWax", tab: "lights", price: 2, places: LEDGE, light: true },
  { id: "candelabraSkull", tab: "lights", price: 3, places: LEDGE, light: true },
  { id: "candelabraSilverFive", tab: "lights", price: 3, places: LEDGE, light: true },
  { id: "candlesSkull", tab: "lights", price: 2, places: LEDGE, light: true },
  // Walls
  { id: "paintingRaven", tab: "walls", price: 1, places: WALL },
  { id: "paintingSea", tab: "walls", price: 1, places: WALL },
  { id: "paintingLady", tab: "walls", price: 2, places: WALL },
  { id: "paintingCastle", tab: "walls", price: 2, places: WALL },
  { id: "paintingAncestor", tab: "walls", price: 3, places: WALL, rare: true },
  { id: "mirrorGilt", tab: "walls", price: 2, places: WALL },
  { id: "mirrorGhost", tab: "walls", price: null, places: WALL, rare: true },
  // Table
  { id: "clothWhite", tab: "table", price: 1, places: ["cloth"] },
  { id: "clothBlackLace", tab: "table", price: 2, places: ["cloth"] },
  { id: "clothRedVelvet", tab: "table", price: 2, places: ["cloth"] },
  { id: "settingPewter", tab: "table", price: 1, places: ["settings"] },
  { id: "settingSilver", tab: "table", price: 2, places: ["settings"] },
  { id: "settingCrystal", tab: "table", price: 3, places: ["settings"] },
  { id: "vaseBlackRoses", tab: "table", price: 1, places: VASE },
  { id: "vaseLavender", tab: "table", price: 1, places: VASE },
  { id: "vaseLilies", tab: "table", price: 2, places: VASE },
  { id: "vaseRavenRoses", tab: "table", price: 3, places: VASE, rare: true },
  // Treats
  { id: "treatPie", tab: "treats", price: 1, places: TREAT },
  { id: "treatApples", tab: "treats", price: 1, places: TREAT },
  { id: "treatCupcakes", tab: "treats", price: 1, places: TREAT },
  { id: "treatCookies", tab: "treats", price: 1, places: TREAT },
  { id: "treatCakePops", tab: "treats", price: 2, places: TREAT },
  { id: "treatCake", tab: "treats", price: 2, places: TREAT },
  // Fire & music
  { id: "firewood", tab: "fireMusic", price: 2, places: ["fireplace"], autoPlace: "fireplace", light: true },
  { id: "gramophone", tab: "fireMusic", price: 1, places: ["corner"] },
  { id: "recordWaltz", tab: "fireMusic", price: 1, places: [], record: true },
  { id: "recordOrgan", tab: "fireMusic", price: 1, places: [], record: true },
  { id: "recordLullaby", tab: "fireMusic", price: 1, places: [], record: true },
];

export const TABS: TabId[] = ["lights", "walls", "table", "treats", "fireMusic"];

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function catalogItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}

export function canGo(itemId: string, place: string): place is PlaceId {
  return Boolean(BY_ID.get(itemId)?.places.includes(place as PlaceId));
}

/** An owned item as the game sees it. `place` null: in the player's items. */
export type OwnedItem = { id: string; itemId: string; place: PlaceId | null };

/** What the party still needs (Lena, 2026-10-08): cloth, a light, a treat, music. */
export type PartyNeed = "cloth" | "light" | "treat" | "music";

export function partyNeeds(items: OwnedItem[]): PartyNeed[] {
  const placed = items.filter((i) => i.place);
  const has = (test: (c: CatalogItem, i: OwnedItem) => boolean) =>
    placed.some((i) => {
      const c = BY_ID.get(i.itemId);
      return c ? test(c, i) : false;
    });
  const needs: PartyNeed[] = [];
  if (!has((_, i) => i.place === "cloth")) needs.push("cloth");
  if (!has((c) => Boolean(c.light))) needs.push("light");
  if (!has((_, i) => i.place === "treatMiddle" || i.place === "treatFront")) needs.push("treat");
  const gramophone = has((_, i) => i.place === "corner");
  const record = items.some((i) => BY_ID.get(i.itemId)?.record);
  if (!gramophone || !record) needs.push("music");
  return needs;
}

// ---------------------------------------------------------------- the wheel

export type PrizeKind = "stone1" | "stone2" | "stone3" | "item" | "rare";

/** The eight panes, clockwise from the top (the approved mockup). */
export const WHEEL: PrizeKind[] = ["stone1", "item", "stone2", "item", "stone1", "rare", "stone3", "item"];

/** Chances in percent (Lena, 2026-10-07). */
export const ODDS: Record<PrizeKind, number> = { stone1: 35, item: 35, stone2: 15, rare: 10, stone3: 5 };

export const STONES: Partial<Record<PrizeKind, number>> = { stone1: 1, stone2: 2, stone3: 3 };

/** Common prizes: the one-moonstone things you can put in the room. */
export const COMMON_POOL = CATALOG.filter((c) => c.price === 1 && c.places.length > 0).map((c) => c.id);
export const RARE_POOL = CATALOG.filter((c) => c.rare).map((c) => c.id);

/** The paid spin's price, once a day after the free one. */
export const PAID_SPIN_PRICE = 1;

export function rollPrize(random: () => number = Math.random): { kind: PrizeKind; pane: number } {
  let r = random() * 100;
  let kind: PrizeKind = "stone1";
  for (const k of Object.keys(ODDS) as PrizeKind[]) {
    if (r < ODDS[k]) {
      kind = k;
      break;
    }
    r -= ODDS[k];
  }
  const panes = WHEEL.map((k, i) => (k === kind ? i : -1)).filter((i) => i >= 0);
  return { kind, pane: panes[Math.floor(random() * panes.length)] };
}

export function pickFrom(pool: string[], random: () => number = Math.random): string {
  return pool[Math.floor(random() * pool.length)];
}
