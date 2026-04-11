"use client";

import { useTranslations } from "next-intl";
import { PageShell } from "@/components/PageShell";

export const TermsContent = () => {
  const t = useTranslations("legal.terms");

  return (
    <PageShell>
      <main className="legal-page container">
        <article className="legal-page__content">
          <h1>{t("title")}</h1>
          <p><em>{t("lastUpdated")}</em></p>
          <p>{t("intro")}</p>

          <h2>{t("section1.title")}</h2>
          <p>{t("section1.content")}</p>

          <h2>{t("section2.title")}</h2>
          <p>{t("section2.content")}</p>

          <h2>{t("section3.title")}</h2>
          <p>{t("section3.content")}</p>

          <h2>{t("section4.title")}</h2>
          <p>{t("section4.content")}</p>
          <ul>
            {(t.raw("section4.items") as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2>{t("section5.title")}</h2>
          <p>{t("section5.content")}</p>

          <h2>{t("section6.title")}</h2>
          <p>{t("section6.content")}</p>

          <h2>{t("section7.title")}</h2>
          <p>{t("section7.content")}</p>

          <h2>{t("section8.title")}</h2>
          <p>{t("section8.content")}</p>

          <h2>{t("section9.title")}</h2>
          <p>{t("section9.content")}</p>

          <h2>{t("section10.title")}</h2>
          <p>{t("section10.content")}</p>

          <h2>{t("section11.title")}</h2>
          <p>{t("section11.content")}</p>

          <h2>{t("section12.title")}</h2>
          <p>{t("section12.content", { email: t("section12.email") })}</p>

          <hr />
          <p>
            <small>
              <strong>Note:</strong> {t("note")}
            </small>
          </p>
        </article>
      </main>
    </PageShell>
  );
};
