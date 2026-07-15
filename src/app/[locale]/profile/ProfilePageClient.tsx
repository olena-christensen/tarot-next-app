"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { UserProfile } from "@/components/UserProfile";

function ProfileContent() {
  const { data: session, status } = useSession();
  const t = useTranslations("ui");
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  return (
    <main className="profile-page container">
      <h1 className="profile-page__title title">{t("profileTitle")}</h1>
      {/* Gate on session?.user (not status) so a transient `status === "loading"`
          during a NextAuth `update()` — fired when e.g. choosing a reader — does
          NOT unmount UserProfile and tear down its open modals. The session data
          persists across an update(), so this stays mounted; unauthenticated is
          handled by the redirect effect above. */}
      {session?.user ? <UserProfile /> : null}
    </main>
  );
}

export function ProfilePageClient() {
  return (
    <PageShell>
      <ProfileContent />
    </PageShell>
  );
}
