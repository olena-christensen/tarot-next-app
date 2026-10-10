import { Raleway } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { CookieBanner } from "@/components/CookieBanner";
import { englishMessages as messages } from "@/i18n/englishMessages";
import { Analytics } from "@vercel/analytics/next";

const raleway = Raleway({ subsets: ["latin", "latin-ext", "cyrillic"] });

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={raleway.className}>
        <NextIntlClientProvider locale="en" messages={messages as never}>
          {children}
          <CookieBanner />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
