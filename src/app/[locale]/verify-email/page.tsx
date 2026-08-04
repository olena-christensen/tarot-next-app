import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { VerifyEmailClient } from "./VerifyEmailClient";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "ui" });
  return {
    title: t("verifyEmailTitle"),
    // Reached only from an emailed link — never index it.
    robots: { index: false, follow: false },
  };
}

export default function VerifyEmailPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return <VerifyEmailClient />;
}
