import { Raleway } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { CookieBanner } from "@/components/CookieBanner";
import enUi from "../../../messages/en/ui.json";
import enPlans from "../../../messages/en/plans.json";
import enReadings from "../../../messages/en/readings.json";
import enDisclaimers from "../../../messages/en/disclaimers.json";

const raleway = Raleway({ subsets: ["latin", "latin-ext", "cyrillic"] });

const messages = {
  ...enUi,
  ...enPlans,
  ...enReadings,
  ...enDisclaimers,
};

export default function CookiePolicyLayout({
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
