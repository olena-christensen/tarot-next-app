import { describe, it, expect } from "vitest";
import { MOONSTONE_PACKS, MOONSTONE_PACK_ORDER, PEG_EUR_UAH, isMoonstonePack } from "./moonstones";

describe("moonstone packs", () => {
  it("charges exactly the advertised euro price at the peg", () => {
    // Same reason as the PLAN_PRICES test in mono.test.ts: the charge is in
    // hryvnia, so nothing on screen would reveal a drift between label and charge.
    for (const id of MOONSTONE_PACK_ORDER) {
      const p = MOONSTONE_PACKS[id];
      expect(p.priceMinorUah, id).toBe(Math.round(p.priceEur * PEG_EUR_UAH * 100));
    }
  });

  it("lists every pack once, in order of size", () => {
    expect(new Set(MOONSTONE_PACK_ORDER).size).toBe(Object.keys(MOONSTONE_PACKS).length);
    const sizes = MOONSTONE_PACK_ORDER.map((id) => MOONSTONE_PACKS[id].qty);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  });

  it("recognises pack ids and nothing else", () => {
    expect(isMoonstonePack("MOONSTONES_10")).toBe(true);
    expect(isMoonstonePack("SINGLE")).toBe(false);
    expect(isMoonstonePack("MONTHLY")).toBe(false);
    expect(isMoonstonePack(undefined)).toBe(false);
  });
});
