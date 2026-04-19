import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { DeckSelector } from "@/components/DeckSelector";
import { buildAlternates } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t("decks.metaTitle");
  const description = t("decks.metaDescription");
  const alternates = buildAlternates({ locale, path: "/decks" });

  return {
    title,
    description,
    keywords: t("decks.keywords"),
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default function DecksPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return (
    <PageShell>
      <DeckSelector />
    </PageShell>
  );
}
