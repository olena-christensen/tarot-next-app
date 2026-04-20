import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  const t = useTranslations("ui");

  return (
    <PageShell>
      <main className="not-found">
        <h1 className="title title--primary">{t("notFound.title")}</h1>
        <p className="not-found__text">{t("notFound.description")}</p>
        <Link href="/" className="mystic-btn">
          {t("notFound.backHome")}
        </Link>
      </main>
    </PageShell>
  );
}
