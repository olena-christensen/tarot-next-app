import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { ProfilePageClient } from "./ProfilePageClient";
import { absoluteUrl, localizedPath } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return {
    title: t("profile.metaTitle"),
    description: t("profile.metaDescription"),
    robots: { index: false, follow: false },
    alternates: {
      canonical: absoluteUrl(localizedPath(locale, "/profile")),
    },
  };
}

export default function ProfilePage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return <ProfilePageClient />;
}
