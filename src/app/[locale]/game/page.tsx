import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { GameChoice } from "@/components/GameChoice";
import { absoluteUrl, buildAlternates } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "game" });
  const title = t("hubMetaTitle");
  const description = t("hubMetaDescription");
  const alternates = buildAlternates({ locale, path: "/game" });
  const image = absoluteUrl("/game-art/cover-castle.jpg");

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, url: alternates.canonical, images: [image] },
    twitter: { title, description, images: [image] },
  };
}

/** All the games (Lena, 2026-10-14): the potion game lives at /potion now. */
export default function GamesPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return (
    <PageShell>
      <section className="games-page">
        <GameChoice />
      </section>
    </PageShell>
  );
}
