import type { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { ContactForm } from "./ContactForm";
import { buildAlternates } from "@/lib/seo";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  const alternates = buildAlternates({ locale, path: "/contact" });

  return {
    title,
    description,
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

export default function ContactPage({ params }: Props) {
  unstable_setRequestLocale(params.locale);
  return (
    <PageShell>
      <main className="legal-page container">
        <ContactForm />
      </main>
    </PageShell>
  );
}
