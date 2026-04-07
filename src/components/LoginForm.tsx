"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

type LoginFormProps = {
  onSuccess?: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
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
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
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
        setError("Invalid email or password");
      } else {
        onSuccess?.();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (isSignUp && !acceptTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
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
            What Shall We Call You?
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
          Pledge Your Soul (Or Just Your Email)
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
        <label htmlFor="password" className="form__label">Enchanted Phrase</label>
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
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="form__link">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="form__link">
                Privacy Policy
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
            ? "Channeling..."
            : isSignUp
              ? "Begin the Ritual"
              : "Complete the Ritual"
          }
        </button>

        <button
          type="button"
          className="btn form__btn form__btn--google"
          onClick={handleGoogleSignIn}
        >
          Let Google Speak Your Name
        </button>

        <a
          className="form__toggle"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
        >
          {isSignUp
            ? "Already initiated? Enter the Sanctum"
            : "New to the craft? Join the Circle of the Chosen"
          }
        </a>
      </div>
    </form>
  );
};
