"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

type LoginFormProps = {
  onSuccess?: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const t = useTranslations("ui");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
          body: JSON.stringify({ name, email, password, acceptTerms }),
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
        redirect: false,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
      } else {
        onSuccess?.();
      }
    } catch {
      setError(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (isSignUp && !acceptTerms) {
      setError(t("acceptTermsError"));
      return;
    }
    if (isSignUp) {
      // Short-lived cookie read by the NextAuth events.createUser callback
      // so we can record termsAcceptedAt for new OAuth users.
      document.cookie = "tarot_terms_consent=1; path=/; max-age=600; samesite=lax";
    }
    signIn("google", { callbackUrl: "/" });
  };

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
        <input
          type="email"
          id="email"
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
            className="form__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>

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
              <Link href="/terms" target="_blank" className="form__link">
                {t("termsOfService")}
              </Link>{" "}
              {t("and")}{" "}
              <Link href="/privacy" target="_blank" className="form__link">
                {t("privacyPolicy")}
              </Link>
              .
            </span>
          </label>
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
          disabled={isLoading}
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
