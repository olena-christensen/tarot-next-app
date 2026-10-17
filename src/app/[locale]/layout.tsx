import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildJsonLd } from "@/lib/seo";
import { CookieBanner } from "@/components/CookieBanner";
import { SiteChrome } from "@/components/SiteChrome";
import { Analytics } from "@vercel/analytics/next";
import { introBootScript } from "@/lib/intro";
import { halloweenBootScript } from "@/lib/halloween";

const raleway = Raleway({ subsets: ["latin", "latin-ext", "cyrillic"] });

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  if (!routing.locales.includes(locale as any)) return {};

  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t("home.metaTitle");
  const description = t("home.metaDescription");
  const siteName = t("siteName");
  const alternates = buildAlternates({ locale, path: "/" });

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: t("home.keywords"),
    alternates,
    openGraph: {
      type: "website",
      locale,
      url: alternates.canonical,
      siteName,
      title,
      description,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  const t = await getTranslations({ locale, namespace: "seo" });
  const jsonLd = buildJsonLd({
    locale,
    siteName: t("siteName"),
    description: t("home.metaDescription"),
  });
  const jsonLdString = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    // suppressHydrationWarning: the boot scripts set data-intro and data-halloween on <html> before React loads.
    <html lang={locale} suppressHydrationWarning>
      <body className={raleway.className}>
        {/* Decides whether the home page intro plays — must run before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: introBootScript(routing.locales) }} />
        {/* Decides whether the Halloween banner shows — same reason. */}
        <script dangerouslySetInnerHTML={{ __html: halloweenBootScript() }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString }}
        />
        <NextIntlClientProvider messages={messages}>
          {/* Header, session, background and login window: mounted once and
              kept between pages (components/SiteChrome.tsx). */}
          <SiteChrome>{children}</SiteChrome>
          <CookieBanner />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
