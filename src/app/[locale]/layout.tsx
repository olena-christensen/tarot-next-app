import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo";

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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  return (
    <html lang={locale}>
      <body className={raleway.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
