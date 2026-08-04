export type PlanId = "FREE" | "SINGLE" | "MONTHLY" | "YEARLY";

export type Plan = {
  id: PlanId;
  priceLabel: string;
  interval: "one-time" | "month" | "year" | null;
  highlight?: boolean;
  /**
   * Indices into this plan's `features` array (messages/{locale}/plans.json)
   * that are advertised but not built yet. The card renders `ui.comingSoon`
   * beside them, so the honest label lives in ONE translated key instead of
   * being pasted into every locale's copy.
   *
   * Indices, not text, because the feature lists are parallel arrays across
   * locales. `plans.test.ts` asserts they stay the same length so a marker
   * cannot silently drift onto the wrong line.
   */
  comingSoonFeatures?: number[];
};

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    priceLabel: "€0",
    interval: null,
  },
  SINGLE: {
    id: "SINGLE",
    priceLabel: "€1",
    interval: "one-time",
  },
  MONTHLY: {
    id: "MONTHLY",
    priceLabel: "€5",
    interval: "month",
    // 4 = long-form interpretations
    comingSoonFeatures: [4],
  },
  YEARLY: {
    id: "YEARLY",
    priceLabel: "€39",
    interval: "year",
    highlight: true,
    // 2 = exclusive seasonal decks, 3 = early access to new diviners & decks
    comingSoonFeatures: [2, 3],
  },
};

export const PLAN_ORDER: PlanId[] = ["FREE", "SINGLE", "MONTHLY", "YEARLY"];
