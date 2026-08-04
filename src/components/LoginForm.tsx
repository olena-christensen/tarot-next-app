"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Where the last-used address is kept when "remember me" is ticked. The EMAIL
 * only — a password is never stored client-side; that is the browser password
 * manager's job, not ours.
 */
const REMEMBERED_EMAIL_KEY = "theveil_remembered_email";

type LoginFormProps = {
  onSuccess?: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const t = useTranslations("ui");
  const tDisc = useTranslations("disclaimers");
  const locale = useLocale();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAge, setAcceptAge] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Prefill from the last remembered address. Runs after hydration, so the
  // server and the first client render still agree on an empty field.
  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sign-up submit is blocked until BOTH the terms checkbox and the 18+ checkbox are ticked.
  const signupBlocked = isSignUp && (!acceptTerms || !acceptAge);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp && !acceptAge) {
      setError(tDisc("ageRequiredError"));
      return;
    }
    if (isSignUp && !acceptTerms) {
      setError(t("acceptTermsError"));
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // acceptAge added alongside acceptTerms — server validates both.
          body: JSON.stringify({ name, email, password, acceptTerms, acceptAge }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error);
          setIsLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        // Credentials are transported as strings; auth.ts parses it back.
        rememberMe: String(rememberMe),
        redirect: false,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
      } else {
        // Only after a sign-in that actually worked — no point remembering an
        // address that was rejected. Unticking clears it.
        if (rememberMe) {
          window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        } else {
          window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
        onSuccess?.();
      }
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      if (!res.ok) {
        setError(t("somethingWentWrong"));
        return;
      }
      // The endpoint answers ok for unknown addresses too, so this message must
      // stay neutral — it never confirms that an account exists.
      setResetSent(true);
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const backToSignIn = () => {
    setIsForgot(false);
    setResetSent(false);
    setError("");
  };

  const handleGoogleSignIn = () => {
    if (isSignUp && !acceptAge) {
      setError(tDisc("ageRequiredError"));
      return;
    }
    if (isSignUp && !acceptTerms) {
      setError(t("acceptTermsError"));
      return;
    }
    if (isSignUp) {
      // Short-lived cookies read by the NextAuth events.createUser callback
      // so we can record termsAcceptedAt for new OAuth users.
      document.cookie = "tarot_terms_consent=1; path=/; max-age=600; samesite=lax";
      document.cookie = "tarot_age_consent=1; path=/; max-age=600; samesite=lax";
    }
    signIn("google", { callbackUrl: "/" });
  };

  if (isForgot) {
    return (
      <form className="form form--login" onSubmit={handleForgotSubmit}>
        <p className="form__intro">{t("forgotPasswordIntro")}</p>
        {resetSent ? (
          <div className="form__success">{t("resetLinkSent")}</div>
        ) : (
          <div className="form__input-block">
            <label htmlFor="forgot-email" className="form__label">
              {t("pledgeYourSoul")}
            </label>
            <input
              type="email"
              id="forgot-email"
              className="form__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        )}
        {error && <div className="form__error">{error}</div>}
        <div className="form__input-block">
          {!resetSent && (
            <button type="submit" className="btn form__btn" disabled={isLoading}>
              {isLoading ? t("channeling") : t("sendResetLink")}
            </button>
          )}
          <a className="form__toggle" onClick={backToSignIn}>
            {t("backToSignIn")}
          </a>
        </div>
      </form>
    );
  }

  return (
    <form className="form form--login" onSubmit={handleCredentialsSubmit}>
      {isSignUp && (
        <div className="form__input-block">
          <label htmlFor="name" className="form__label">
            {t("whatShallWeCallYou")}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            className="form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}
      <div className="form__input-block">
        <label htmlFor="email" className="form__label">
          {t("pledgeYourSoul")}
        </label>
        {/* `name` + `autoComplete` are what tell a password manager this is a
            login form worth saving. Without them Chrome never offers to fill it.
            "username" rather than "email" — that is the token managers key on. */}
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="username"
          className="form__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form__input-block">
        <label htmlFor="password" className="form__label">{t("enchantedPhrase")}</label>
        <div className="form__input-wrap form__input-wrap--password">
          <input
            type="password"
            id="password"
            name="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="form__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {!isSignUp && (
          <a
            className="form__forgot"
            onClick={() => {
              setIsForgot(true);
              setError("");
            }}
          >
            {t("forgotPassword")}
          </a>
        )}
      </div>

      {/* Sign-in only. On sign-up the account is brand new, so keeping the
          session is the sane default and one more checkbox is noise. */}
      {!isSignUp && (
        <div className="form__input-block form__input-block--checkbox">
          <label className="form__checkbox-label">
            <input
              type="checkbox"
              className="form__checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>{t("rememberMe")}</span>
          </label>
        </div>
      )}

      {isSignUp && (
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

          <p className="form__disclaimer">{tDisc("entertainmentShort")}</p>
        </div>
      )}

      {error && (
        <div className="form__error">
          {error}
        </div>
      )}

      <div className="form__input-block">
        <button
          type="submit"
          className="btn form__btn"
          disabled={isLoading || signupBlocked}
        >
          {isLoading
            ? t("channeling")
            : isSignUp
              ? t("beginTheRitual")
              : t("completeTheRitual")
          }
        </button>

        <button
          type="button"
          className="btn form__btn form__btn--google"
          onClick={handleGoogleSignIn}
          disabled={signupBlocked}
        >
          {t("letGoogleSpeak")}
        </button>

        <a
          className="form__toggle"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
        >
          {isSignUp
            ? t("alreadyInitiated")
            : t("newToTheCraft")
          }
        </a>
      </div>
    </form>
  );
};
