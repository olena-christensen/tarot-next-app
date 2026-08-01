import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { HistoryPageClient } from "./HistoryPageClient";
import { absoluteUrl, localizedPath } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("history.metaTitle"),
    description: t("history.metaDescription"),
    // Private, per-user content — same posture as /profile.
    robots: { index: false, follow: false },
    alternates: {
      canonical: absoluteUrl(localizedPath(locale, "/history")),
    },
  };
}

export default function HistoryPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return <HistoryPageClient />;
}
