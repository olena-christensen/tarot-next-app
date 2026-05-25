import type { Metadata } from "next";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | The Veil",
  description:
    "How The Veil collects, processes, and protects your personal information.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
