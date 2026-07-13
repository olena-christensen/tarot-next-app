import { Raleway } from "next/font/google";

const raleway = Raleway({ subsets: ["latin", "latin-ext", "cyrillic"] });

// Self-contained root layout for the unprefixed /payment/* fallback route.
// The real result page is localized at /{locale}/payment/result; this top-level
// route only exists as a safety fallback and immediately redirects to the
// default-locale page, so it needs its own minimal <html>/<body> (no next-intl
// provider — nothing here renders translated content).
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
