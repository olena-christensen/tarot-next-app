import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PrivacyContent } from "./PrivacyContent";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  return <PrivacyContent />;
}
