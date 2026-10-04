import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { BrewPotionGame } from "@/components/BrewPotionGame";
import { absoluteUrl, buildAlternates } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "game" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  const alternates = buildAlternates({ locale, path: "/game" });
  const image = absoluteUrl("/game-art/potion/room.webp");

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, url: alternates.canonical, images: [image] },
    twitter: { title, description, images: [image] },
  };
}

export default function GamePage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return (
    <PageShell>
      <BrewPotionGame />
    </PageShell>
  );
}
