import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { buildAlternates } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t("subscription.metaTitle");
  const description = t("subscription.metaDescription");
  const alternates = buildAlternates({ locale, path: "/subscription" });

  return {
    title,
    description,
    keywords: t("subscription.keywords"),
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

export default function SubscriptionPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return (
    <PageShell>
      <SubscriptionPlans />
    </PageShell>
  );
}
