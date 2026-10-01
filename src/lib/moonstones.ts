// Moonstones — The Veil's own currency (replaced the €1 "Offering", 2026-10-01).
//
// One moonstone = one reading today; the same balance is meant to pay for other
// things in the app later (decks, rituals…). Stored in the existing
// `Subscription.readingCredits` column — the column name is internal, the
// product name is "moonstones" everywhere a user can see it.
//
// Packs are one-time purchases, never a tier: they are NOT PlanIds and never
// touch `Subscription.planId`. They travel through the same invoice flow as the
// plans (`pendingPlanId` / `Payment.productType` are plain strings), and
// `applyMonoInvoiceStatus` adds `qty` to the balance on a confirmed success.

import { PEG_EUR_UAH } from "@/lib/mono";

export type MoonstonePackId = "MOONSTONES_3" | "MOONSTONES_10" | "MOONSTONES_25";

export type MoonstonePack = {
  id: MoonstonePackId;
  /** Moonstones added to the balance on a confirmed payment. */
  qty: number;
  /** Advertised price in whole euros. DISPLAY ONLY — never sent to mono. */
  priceEur: number;
  /**
   * What is actually charged, in kopiykas: priceEur × PEG_EUR_UAH × 100.
   * Literals, like PLAN_PRICES, so the charged amount is greppable;
   * moonstones.test.ts asserts they match the peg. RE-PEG together with
   * PLAN_PRICES in lib/mono.ts.
   */
  priceMinorUah: number;
  /** The pack marked "Best for most". */
  highlight?: boolean;
};

export const MOONSTONE_PACKS: Record<MoonstonePackId, MoonstonePack> = {
  MOONSTONES_3: { id: "MOONSTONES_3", qty: 3, priceEur: 3, priceMinorUah: 15750 }, // €3  → ₴157.50
  MOONSTONES_10: { id: "MOONSTONES_10", qty: 10, priceEur: 8, priceMinorUah: 42000, highlight: true }, // €8  → ₴420.00
  MOONSTONES_25: { id: "MOONSTONES_25", qty: 25, priceEur: 18, priceMinorUah: 94500 }, // €18 → ₴945.00
};

export const MOONSTONE_PACK_ORDER: MoonstonePackId[] = [
  "MOONSTONES_3",
  "MOONSTONES_10",
  "MOONSTONES_25",
];

export function isMoonstonePack(value: unknown): value is MoonstonePackId {
  return typeof value === "string" && value in MOONSTONE_PACKS;
}

/** Re-exported so the test can assert the literals against the same peg. */
export { PEG_EUR_UAH };
