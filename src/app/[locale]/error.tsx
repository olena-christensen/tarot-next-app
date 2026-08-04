"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";
import { MysticButton } from "@/components/MysticButton";

/**
 * Catches render errors inside a locale segment.
 *
 * Reuses `PageShell` and the not-found layout so a crash still looks like the
 * app rather than Next's default white screen. Translated, because the locale
 * layout's `NextIntlClientProvider` is already mounted by the time a page can
 * fail — `global-error.tsx` is the untranslated last resort for when the layout
 * itself is what broke.
 *
 * `reset()` re-renders the segment. It genuinely fixes a transient failure (a
 * fetch that timed out) and does nothing for a deterministic one, which is why
 * the way home sits beside it rather than behind it.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ui");

  useEffect(() => {
    // The digest is the only handle on the server-side stack, which Next
    // deliberately withholds from the client in production.
    console.error("[error-boundary]", error.digest ?? "", error);
  }, [error]);

  return (
    <PageShell>
      <main className="not-found">
        <h1 className="title title--primary">{t("errorTitle")}</h1>
        <p className="not-found__text">{t("errorBody")}</p>
        <div className="not-found__actions">
          <MysticButton onClick={reset}>{t("errorRetry")}</MysticButton>
          <Link href="/" className="btn not-found__home">
            {t("notFound.backHome")}
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
