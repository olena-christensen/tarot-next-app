import type { Metadata } from "next";
import { PaymentResult } from "./PaymentResult";

export const metadata: Metadata = {
  title: "Payment | The Veil",
  // Transient post-payment landing page — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default function PaymentResultPage() {
  return <PaymentResult />;
}
