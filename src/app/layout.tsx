import type { Metadata, Viewport } from "next";
import "../assets/scss/style.scss";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Tarot",
  description: "Unveil the mysteries of your future with our mystical tarot reading app.",
  // Google Search Console ownership, added 2026-08-08. Lives in the ROOT layout
  // so the tag is present on every page including the locale ones — the bare
  // domain redirects to /{locale}, and a verification tag that only exists on a
  // redirect target is the usual reason verification fails.
  //
  // Do not remove after verification succeeds: Google re-checks periodically and
  // silently drops the property when the tag disappears.
  verification: {
    google: "nUZQLHYx7Ffqrw2ljqs70-iHqhcUUlq8NJ3MaGUqp-Y",
  },
};

export const viewport: Viewport = {
  themeColor: "#090909",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
