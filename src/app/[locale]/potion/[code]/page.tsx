import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { Link } from "@/i18n/navigation";
import { decodeGift } from "@/lib/potionGame";
import { absoluteUrl } from "@/lib/seo";

// Same picture for every potion: the glowing bottle alone, made by
// scripts/build-potion-art.py. Centred so Slack's small square crop is clean.
const SHARE_CARD = {
  url: absoluteUrl("/game-art/potion/share-card.png"),
  width: 1200,
  height: 630,
  alt: "",
};

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
  // Who brewed what for whom lives in the words; the picture is only the bottle.
  const title = `${gift.from ? t("giftCardFrom", { name: gift.from }) : t("giftCardAnon")} ${potion}`;
  const description = t("giftMetaDescription");
  // Its own canonical and og:url. Without them the layout's canonical (the main
  // page) is inherited, and Messenger/Facebook follow it — showing the main
  // page's card instead of the potion's. Deliberately WITHOUT a language: the
  // shared link has none either, so whoever opens it is sent to their own
  // language by the middleware (Lena, 2026-10-06).
  const url = absoluteUrl(`/potion/${params.code}`);
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "The Veil", images: [SHARE_CARD] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_CARD.url] },
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
