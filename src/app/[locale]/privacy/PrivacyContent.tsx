"use client";

import { useTranslations } from "next-intl";
import { PageShell } from "@/components/PageShell";

export const PrivacyContent = () => {
  const t = useTranslations("legal.privacy");

  return (
    <PageShell>
      <main className="legal-page container">
        <article className="legal-page__content">
          <h1>{t("title")}</h1>
          <p><em>{t("lastUpdated")}</em></p>
          <p>{t("intro")}</p>

          <h2>{t("section1.title")}</h2>
          <p>{t("section1.content", { email: t("section1.email") })}</p>

          <h2>{t("section2.title")}</h2>
          <ul>
            {(t.raw("section2.items") as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2>{t("section3.title")}</h2>
          <ul>
            {(t.raw("section3.items") as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2>{t("section4.title")}</h2>
          <ul>
            {(t.raw("section4.items") as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2>{t("section5.title")}</h2>
          <p>{t("section5.content")}</p>
          <ul>
            {(t.raw("section5.items") as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2>{t("section6.title")}</h2>
          <p>{t("section6.content")}</p>

          <h2>{t("section7.title")}</h2>
          <p>{t("section7.content")}</p>

          <h2>{t("section8.title")}</h2>
          <p>{t("section8.content")}</p>
          <ul>
            {(t.raw("section8.items") as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p>{t("section8.ccpaNote")}</p>

          <h2>{t("section9.title")}</h2>
          <p>{t("section9.content")}</p>

          <h2>{t("section10.title")}</h2>
          <p>{t("section10.content")}</p>

          <h2>{t("section11.title")}</h2>
          <p>{t("section11.content")}</p>

          <h2>{t("section12.title")}</h2>
          <p>{t("section12.content")}</p>

          <h2>{t("section13.title")}</h2>
          <p>{t("section13.content", { email: t("section13.email") })}</p>

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
