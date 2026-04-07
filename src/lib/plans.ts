export type PlanId = "FREE" | "SINGLE" | "MONTHLY" | "YEARLY";

export type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  interval: "one-time" | "month" | "year" | null;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceLabel: "$0",
    interval: null,
    features: ["3 readings per day", "Resets at midnight"],
  },
  SINGLE: {
    id: "SINGLE",
    name: "Single reading",
    priceLabel: "$1",
    interval: "one-time",
    features: ["One extra reading", "No subscription"],
  },
  MONTHLY: {
    id: "MONTHLY",
    name: "Monthly",
    priceLabel: "$10",
    interval: "month",
    features: [
      "Unlimited readings",
      "Reading history",
      "Choose your deck",
      "Choose your diviner",
      "Long-form interpretations",
      "Daily card email",
      "Export readings as PDF",
      "Favorites & personal notes",
      "Reminder notifications",
      "Ad-free",
    ],
  },
  YEARLY: {
    id: "YEARLY",
    name: "Yearly",
    priceLabel: "$50",
    interval: "year",
    features: [
      "Everything in Monthly",
      "Save 58% vs monthly",
      "Exclusive seasonal decks",
      "Early access to new diviners & decks",
    ],
    highlight: true,
  },
};

export const PLAN_ORDER: PlanId[] = ["FREE", "SINGLE", "MONTHLY", "YEARLY"];
