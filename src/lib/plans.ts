export type PlanId = "FREE" | "SINGLE" | "MONTHLY" | "YEARLY";

export type Plan = {
  id: PlanId;
  priceLabel: string;
  interval: "one-time" | "month" | "year" | null;
  highlight?: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  FREE: {
    id: "FREE",
    priceLabel: "$0",
    interval: null,
  },
  SINGLE: {
    id: "SINGLE",
    priceLabel: "$1",
    interval: "one-time",
  },
  MONTHLY: {
    id: "MONTHLY",
    priceLabel: "$10",
    interval: "month",
  },
  YEARLY: {
    id: "YEARLY",
    priceLabel: "$50",
    interval: "year",
    highlight: true,
  },
};

export const PLAN_ORDER: PlanId[] = ["FREE", "SINGLE", "MONTHLY", "YEARLY"];
