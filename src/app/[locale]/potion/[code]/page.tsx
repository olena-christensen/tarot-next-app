import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { Link } from "@/i18n/navigation";
import { decodeGift } from "@/lib/potionGame";

type Props = {
  params: { locale: string; code: string };
};

/**
 * A potion someone brewed in "Brew the Potion" and sent to a friend. Everything
 * is in the link (see encodeGift) — no database. Not indexed: these are personal.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gift = decodeGift(params.code);
  const t = await getTranslations({ locale: params.locale, namespace: "game" });
  if (!gift) return { robots: { index: false, follow: false } };
  const potion = t(`potionNames.${gift.potion}`);
  const title = t("giftMetaTitle", { potion });
  const description = t("giftMetaDescription");
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PotionGiftPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  const gift = decodeGift(params.code);
  if (!gift) notFound();
  const t = await getTranslations({ locale: params.locale, namespace: "game" });

  return (
    <PageShell>
      <section className="potion-gift">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="potion-gift__bottle" src="/game-art/potion/bottle.webp" alt="" />
        <p className="potion-gift__from">
          {gift.from ? t("giftFrom", { name: gift.from }) : t("giftFromAnon")}
        </p>
        <h1 className="potion-gift__name">{t(`potionNames.${gift.potion}`)}</h1>
        <Link href="/game" className="potion-gift__cta">
          {t("brewYourOwn")}
        </Link>
      </section>
    </PageShell>
  );
}
