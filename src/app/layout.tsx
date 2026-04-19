import type { Metadata } from "next";
import "../assets/scss/style.scss";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Tarot",
  description: "Unveil the mysteries of your future with our mystical tarot reading app.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
