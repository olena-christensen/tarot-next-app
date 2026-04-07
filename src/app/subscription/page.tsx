import type { Metadata } from "next";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";

export const metadata: Metadata = {
  title: "Pricing — Tarot",
  description: "Choose a plan and unlock unlimited readings.",
};

export default function SubscriptionPage() {
  return <SubscriptionPlans />;
}
