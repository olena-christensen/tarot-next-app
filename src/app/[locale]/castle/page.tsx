import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { CastleGame } from "@/components/castle/CastleGame";
import { absoluteUrl, buildAlternates } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "castle" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  const alternates = buildAlternates({ locale, path: "/castle" });
  const image = absoluteUrl("/game-art/castle/share-card.jpg");

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, url: alternates.canonical, images: [image] },
    twitter: { title, description, images: [image] },
  };
}

export default function CastlePage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return (
    <PageShell>
      <CastleGame />
    </PageShell>
  );
}
