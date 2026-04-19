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
      <h1 className="profile-page__title title">{t("yourMysticProfile")}</h1>
      {status === "authenticated" && session?.user ? <UserProfile /> : null}
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
