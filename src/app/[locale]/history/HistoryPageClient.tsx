"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";
import { ReadingHistory } from "@/components/ReadingHistory";

function HistoryContent() {
  const { data: session, status } = useSession();
  const t = useTranslations("history");
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  return (
    <main className="history-page container">
      <h1 className="history-page__title title">{t("title")}</h1>
      {/* Gate on session?.user (not status): a NextAuth update() flips status to
          "loading" mid-flight and would unmount the list and its open modal. */}
      {session?.user ? <ReadingHistory /> : null}
    </main>
  );
}

export function HistoryPageClient() {
  return (
    <PageShell>
      <HistoryContent />
    </PageShell>
  );
}
