import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { Link } from "@/i18n/navigation";
import { giftView, type GiftView } from "@/lib/castleGame/server";
import { catalogItem } from "@/lib/castleGame/catalog";
import { CastleGiftTake } from "@/components/castle/CastleGiftTake";
import { absoluteUrl } from "@/lib/seo";

type Props = {
  params: { locale: string; id: string };
};

const VALID_ID = /^[a-z0-9]{10,40}$/;

async function view(id: string): Promise<GiftView> {
  if (!VALID_ID.test(id)) return { status: "gone", itemId: null, from: null };
  try {
    return await giftView(id);
  } catch {
    return { status: "gone", itemId: null, from: null }; // database unreachable
  }
}

/**
 * An item someone sent from their castle. Not indexed (personal). Canonical and
 * og:url are WITHOUT a language, like the shared link, so each friend is sent
 * to their own language (same as the potion gift page).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "castle" });
  const gift = await view(params.id);
  const item = gift.itemId && catalogItem(gift.itemId) ? t(`items.${gift.itemId}`) : "";
  const title = gift.from ? t("giftCardFrom", { name: gift.from, item }) : t("giftCardAnon", { item });
  const description = t("giftMetaDescription");
  const url = absoluteUrl(`/castle/gift/${params.id}`);
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    // The picture comes from opengraph-image.tsx next to this page: the item, the
    // sender and the hall, as a PNG that Facebook and others can show.
    openGraph: { type: "website", url, title, description, siteName: "The Veil" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CastleGiftPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "castle" });
  const gift = await view(params.id);
  const known = gift.itemId && catalogItem(gift.itemId) ? gift.itemId : null;

  return (
    <PageShell>
      <section className="castle-gift">
        {gift.status === "available" && (
          <p className="castle-gift__from">
            {gift.from ? t("giftSentYou", { name: gift.from }) : t("giftSentYouAnon")}
          </p>
        )}
        {known && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="castle-gift__pic" src={`/game-art/castle/icons/${known}.webp`} alt="" />
            <h1 className="castle-gift__name">{t(`items.${known}`)}</h1>
          </>
        )}
        <CastleGiftTake giftId={params.id} status={gift.status} />
        <Link href="/castle" className="castle-gift__cta">
          {t("openCastle")}
        </Link>
      </section>
    </PageShell>
  );
}
