import type { Metadata } from "next";
import { RefundContent } from "./RefundContent";

export const metadata: Metadata = {
  title: "Refund Policy | The Veil",
  description:
    "How to request a refund for a subscription to The Veil, including eligibility and process.",
};

export default function RefundPage() {
  return <RefundContent />;
}
