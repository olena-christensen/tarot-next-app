import { Raleway } from "next/font/google";

const raleway = Raleway({ subsets: ["latin", "latin-ext", "cyrillic"] });

// Self-contained root layout for the top-level /payment/* routes. These live
// outside the [locale] tree (Mono's redirectUrl has no locale segment), so they
// render their own <html>/<body> like the legal pages. Intentionally no
// next-intl provider — the result page is English-only for now (see spec).
export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={raleway.className}>{children}</body>
    </html>
  );
}
