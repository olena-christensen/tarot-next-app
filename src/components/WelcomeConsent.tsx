"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/Modal";

/**
 * First-sign-in consent for accounts with no terms acceptance on record —
 * a Google newcomer who used the "Sign in" tab never saw the sign-up
 * checkboxes. Shown on the profile (pages.newUser lands them there), cannot be
 * dismissed: tick both and "Seal the Pact", or sign out. Everyone who accepted
 * on the sign-up form never sees it. See /api/user/consent.
 */
export function WelcomeConsent() {
  const { data: session } = useSession();
  const t = useTranslations("ui");
  const tDisc = useTranslations("disclaimers");
  const [needed, setNeeded] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAge, setAcceptAge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/consent", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.termsAccepted === false) setNeeded(true);
      })
      .catch(() => {
        // Silent: never block the profile on a failed check.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms || !acceptAge || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: true, age: true }),
      });
      if (!res.ok) throw new Error("consent_failed");
      setNeeded(false);
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setSaving(false);
    }
  };

  const name = session?.user?.name?.split(" ")[0];

  return (
    <Modal
      isOpen={needed}
      onClose={() => {}}
      dismissible={false}
      narrow
      title={t("stepThroughTheVeil")}
    >
      <form className="form form--login welcome-consent" onSubmit={handleSubmit}>
        <p className="welcome-consent__lead">
          {name ? t("welcomeConsentLead", { name }) : t("welcomeConsentLeadNoName")}
        </p>

        <div className="form__input-block form__input-block--checkbox">
          <label className="form__checkbox-label">
            <input
              type="checkbox"
              className="form__checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span>
              {t("iAgreeTo")}{" "}
              <NextLink href="/terms" target="_blank" className="form__link">
                {t("termsOfService")}
              </NextLink>{" "}
              {t("and")}{" "}
              <NextLink href="/privacy" target="_blank" className="form__link">
                {t("privacyPolicy")}
              </NextLink>
              .
            </span>
          </label>
          <label className="form__checkbox-label">
            <input
              type="checkbox"
              className="form__checkbox"
              checked={acceptAge}
              onChange={(e) => setAcceptAge(e.target.checked)}
            />
            <span>{tDisc("ageConfirm")}</span>
          </label>
        </div>

        {error && <div className="form__error">{error}</div>}

        <div className="form__input-block">
          <button
            type="submit"
            className="btn form__btn"
            disabled={!acceptTerms || !acceptAge || saving}
          >
            {t("sealThePact")}
          </button>
          <button
            type="button"
            className="welcome-consent__signout"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {t("welcomeSignOut")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
