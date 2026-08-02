"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/PageShell";

const MIN_PASSWORD_LENGTH = 8;

function ResetForm() {
  const t = useTranslations("ui");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "weak_password"
            ? t("passwordMinLength")
            : t("resetPasswordInvalid")
        );
        return;
      }
      // Sign them straight in with the phrase they just set, so "back to the
      // gate" lands them already logged in. A failure here isn't fatal — the
      // password did change, they just arrive signed out.
      const { email } = await res.json();
      if (email) {
        await signIn("credentials", { email, password, redirect: false });
      }
      setIsDone(true);
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="reset-password container">
      <h1 className="reset-password__title title">{t("resetPasswordTitle")}</h1>
      {isDone ? (
        <div className="reset-password__panel">
          <p className="form__success">{t("resetPasswordSuccess")}</p>
          <Link href="/" className="btn form__btn reset-password__back">
            {t("backToSignIn")}
          </Link>
        </div>
      ) : !token ? (
        <div className="reset-password__panel">
          <p className="form__error">{t("resetPasswordInvalid")}</p>
          <Link href="/" className="btn form__btn reset-password__back">
            {t("backToSignIn")}
          </Link>
        </div>
      ) : (
        <form className="form reset-password__panel" onSubmit={handleSubmit}>
          <div className="form__input-block">
            <label htmlFor="reset-password-new" className="form__label">
              {t("newPasswordPlaceholder")}
            </label>
            <input
              id="reset-password-new"
              className="form__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              autoFocus
              disabled={isSaving}
            />
          </div>
          <div className="form__input-block">
            <label htmlFor="reset-password-confirm" className="form__label">
              {t("confirmPasswordPlaceholder")}
            </label>
            <input
              id="reset-password-confirm"
              className="form__input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSaving}
            />
          </div>
          {error && <div className="form__error">{error}</div>}
          <div className="form__input-block">
            <button type="submit" className="btn form__btn" disabled={isSaving}>
              {isSaving ? t("saving") : t("resetPasswordCta")}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

export function ResetPasswordClient() {
  return (
    <PageShell>
      {/* useSearchParams() opts the subtree into client rendering — Next requires
          a Suspense boundary or the whole page fails to prerender. */}
      <Suspense fallback={<main className="reset-password container" />}>
        <ResetForm />
      </Suspense>
    </PageShell>
  );
}
