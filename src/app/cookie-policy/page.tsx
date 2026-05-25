import type { Metadata } from "next";
import { CookiePolicyContent } from "./CookiePolicyContent";

export const metadata: Metadata = {
  title: "Cookie Policy | The Veil",
  description:
    "How The Veil uses cookies and similar tracking technologies on theveil.app.",
};

export default function CookiePolicyPage() {
  return <CookiePolicyContent />;
}
