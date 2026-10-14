import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { CastleGame } from "@/components/castle/CastleGame";
import { absoluteUrl, buildAlternates } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

/**
 * The link a player shares after party night (Lena, 2026-10-14): the game
 * itself, with a dare in its preview — "I survived the party. Will you?".
 * Search engines are pointed at /castle, so this is never a second copy there.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "castle" });
  const title = t("partyShareTitle");
  const description = t("metaDescription");
  const alternates = buildAlternates({ locale, path: "/castle" });
  const image = absoluteUrl("/game-art/castle/share-card.jpg");

  return {
    title,
    description,
    alternates,
    robots: { index: false, follow: true },
    openGraph: { title, description, url: absoluteUrl(`/${locale}/castle/survived`), images: [image] },
    twitter: { title, description, images: [image] },
  };
}

export default function CastleSurvivedPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return (
    <PageShell>
      <CastleGame />
    </PageShell>
  );
}
