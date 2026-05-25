import type { Metadata } from "next";
import { TermsContent } from "./TermsContent";

export const metadata: Metadata = {
  title: "Terms of Service | The Veil",
  description: "The legal terms that govern your use of The Veil.",
};

export default function TermsPage() {
  return <TermsContent />;
}
