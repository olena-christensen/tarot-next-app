"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";

type Status = "working" | "done" | "invalid";

function Verifier() {
  const t = useTranslations("ui");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<Status>("working");
  // React 18 mounts effects twice in dev StrictMode. The token is single-use, so
  // the second call would consume nothing and report "invalid" over a success.
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    if (!token) {
      setStatus("invalid");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        setStatus(res.ok ? "done" : "invalid");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  return (
    <main className="not-found">
      <h1 className="title title--primary">{t("verifyEmailTitle")}</h1>
      <p className="not-found__text">
        {status === "working"
          ? t("verifyEmailWorking")
          : status === "done"
            ? t("verifyEmailSuccess")
            : t("verifyEmailInvalid")}
      </p>
      {status !== "working" && (
        <Link href="/" className="btn not-found__home">
          {t("notFound.backHome")}
        </Link>
      )}
    </main>
  );
}

export function VerifyEmailClient() {
  return (
    <PageShell>
      {/* useSearchParams forces client rendering; without the boundary this page
          fails to prerender at build time — same reason ResetPasswordClient
          wraps its form. */}
      <Suspense fallback={null}>
        <Verifier />
      </Suspense>
    </PageShell>
  );
}
