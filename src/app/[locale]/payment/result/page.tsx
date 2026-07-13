import type { Metadata } from "next";
import { unstable_setRequestLocale } from "next-intl/server";
import { PaymentResult } from "./PaymentResult";

export const metadata: Metadata = {
  title: "Payment",
  // Transient post-payment landing page — keep it out of search indexes.
  robots: { index: false, follow: false },
};

type Props = { params: { locale: string } };

export default function PaymentResultPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return <PaymentResult />;
}
