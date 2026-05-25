import { Raleway } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { CookieBanner } from "@/components/CookieBanner";
import enUi from "../../../messages/en/ui.json";
import enLegal from "../../../messages/en/legal.json";
import enPlans from "../../../messages/en/plans.json";
import enReadings from "../../../messages/en/readings.json";

const raleway = Raleway({ subsets: ["latin", "latin-ext", "cyrillic"] });

const messages = {
  ...enUi,
  ...enLegal,
  ...enPlans,
  ...enReadings,
};

export default function PrivacyLayout({
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
      </body>
    </html>
  );
}
