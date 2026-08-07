import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, type PlanId } from "./plans";
import { PLAN_PRICES_EUR } from "./mono";
import en from "../../messages/en/plans.json";
import no from "../../messages/no/plans.json";
import ru from "../../messages/ru/plans.json";
import uk from "../../messages/uk/plans.json";
import tr from "../../messages/tr/plans.json";

const LOCALES = { en, no, ru, uk, tr } as const;
type Catalogue = { plans: Record<string, { name: string; features: string[] }> };

describe("price label vs price charged", () => {
  // Two sources of truth by necessity: `priceLabel` is what the card shows, and
  // PLAN_PRICES_EUR is what the hryvnia charge is pegged to. Since the charge
  // itself is in a different currency, NOTHING in the interface can reveal a
  // drift between them — a customer would see €5 and be billed for €7 with no
  // visible clue. This test is the only thing standing between those two.
  it("advertises exactly the euro price the hryvnia charge is pegged to", () => {
    for (const id of ["SINGLE", "MONTHLY", "YEARLY"] as const) {
      expect(PLANS[id].priceLabel, `${id} price label`).toBe(
        `€${PLAN_PRICES_EUR[id]}`
      );
    }
  });
});

describe("plan catalogue vs translations", () => {
  it("every plan exists in every locale", () => {
    for (const [locale, messages] of Object.entries(LOCALES)) {
      const { plans } = messages as Catalogue;
      for (const id of PLAN_ORDER) {
        expect(plans[id], `${locale} is missing ${id}`).toBeDefined();
        expect(plans[id].name.trim(), `${locale} ${id} name`).not.toBe("");
      }
    }
  });

  it("keeps feature lists parallel across locales", () => {
    // `comingSoonFeatures` marks features by INDEX, so a locale with a different
    // number of lines would put the marker on the wrong claim — which is the one
    // failure mode that would quietly turn an honest label into a dishonest one.
    const { plans: base } = en as Catalogue;
    for (const [locale, messages] of Object.entries(LOCALES)) {
      const { plans } = messages as Catalogue;
      for (const id of PLAN_ORDER) {
        expect(
          plans[id].features.length,
          `${locale} ${id} has a different number of features than en`
        ).toBe(base[id].features.length);
      }
    }
  });

  it("has no empty feature lines", () => {
    for (const [locale, messages] of Object.entries(LOCALES)) {
      const { plans } = messages as Catalogue;
      for (const id of PLAN_ORDER) {
        plans[id].features.forEach((f, i) => {
          expect(f.trim(), `${locale} ${id}[${i}]`).not.toBe("");
        });
      }
    }
  });

  it("points every coming-soon marker at a real feature", () => {
    const { plans } = en as Catalogue;
    for (const id of PLAN_ORDER) {
      for (const i of PLANS[id as PlanId].comingSoonFeatures ?? []) {
        expect(
          plans[id].features[i],
          `${id} marks index ${i}, which does not exist`
        ).toBeDefined();
      }
    }
  });

  it("does not repeat the phrase inline — it belongs to ui.comingSoon", () => {
    // Guards against drifting back to pasting "(coming soon)" into every locale.
    for (const [locale, messages] of Object.entries(LOCALES)) {
      const { plans } = messages as Catalogue;
      for (const id of PLAN_ORDER) {
        for (const f of plans[id].features) {
          expect(f.toLowerCase(), `${locale} ${id}`).not.toMatch(
            /coming soon|kommer snart|скоро|незабаром|yakında/
          );
        }
      }
    }
  });
});
