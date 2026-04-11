import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { TermsContent } from "./TermsContent";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  return <TermsContent />;
}
