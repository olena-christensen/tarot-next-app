"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

const CATEGORIES = [
  "general",
  "dsar_access",
  "dsar_delete",
  "dsar_correct",
  "legal_ip",
  "other",
] as const;

type Category = (typeof CATEGORIES)[number];

type FormState = {
  name: string;
  email: string;
  category: Category | "";
  message: string;
  website: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  category: "",
  message: "",
  website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

export const ContactForm = () => {
  const t = useTranslations("contact");
  const locale = useLocale();
  const { data: session } = useSession();
  const [values, setValues] = useState<FormState>(INITIAL);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const sessionEmail = session?.user?.email;
    const sessionName = session?.user?.name;
    if (!sessionEmail && !sessionName) return;
    setValues((prev) => ({
      ...prev,
      email: prev.email || sessionEmail || prev.email,
      name: prev.name || sessionName || prev.name,
    }));
  }, [session?.user?.email, session?.user?.name]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fieldError) setFieldError(null);
    if (status === "error") setStatus("idle");
  };

  const validate = (): string | null => {
    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();

    if (!name) return t("errors.nameRequired");
    if (name.length > 100) return t("errors.nameTooLong");
    if (!email) return t("errors.emailRequired");
    if (!EMAIL_RE.test(email)) return t("errors.emailInvalid");
    if (!values.category) return t("errors.categoryRequired");
    if (!message) return t("errors.messageRequired");
    if (message.length < 10) return t("errors.messageTooShort");
    if (message.length > 5000) return t("errors.messageTooLong");
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      setFieldError(error);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          category: values.category,
          message: values.message.trim(),
          website: values.website,
          locale,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && data.ok) {
        setStatus("success");
        setValues(INITIAL);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="contact-form contact-form--success">
        <h1 className="contact-form__heading">{t("heading")}</h1>
        <p className="contact-form__success">{t("success")}</p>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <h1 className="contact-form__heading">{t("heading")}</h1>
      <p className="contact-form__intro">{t("intro")}</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form__input-block">
          <label htmlFor="contact-name" className="form__label">
            {t("fields.name")}
          </label>
          <input
            id="contact-name"
            type="text"
            className="form__input"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            maxLength={100}
            autoComplete="name"
            required
          />
        </div>

        <div className="form__input-block">
          <label htmlFor="contact-email" className="form__label">
            {t("fields.email")}
          </label>
          <input
            id="contact-email"
            type="email"
            className="form__input"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder={t("placeholders.email")}
            autoComplete="email"
            required
          />
        </div>

        <div className="form__input-block">
          <label htmlFor="contact-category" className="form__label">
            {t("fields.category")}
          </label>
          <select
            id="contact-category"
            className="form__input contact-form__select"
            value={values.category}
            onChange={(e) => update("category", e.target.value as Category | "")}
            required
          >
            <option value="" disabled>
              {t("fields.category")}
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="form__input-block">
          <label htmlFor="contact-message" className="form__label">
            {t("fields.message")}
          </label>
          <textarea
            id="contact-message"
            className="form__input contact-form__textarea"
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder={t("placeholders.message")}
            minLength={10}
            maxLength={5000}
            rows={8}
            required
          />
        </div>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => update("website", e.target.value)}
          className="contact-form__honeypot"
          aria-hidden="true"
        />

        {fieldError && <div className="form__error">{fieldError}</div>}
        {status === "error" && <div className="form__error">{t("errorGeneric")}</div>}

        <div className="form__input-block">
          <button
            type="submit"
            className="btn form__btn"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? t("submitting") : t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
};
