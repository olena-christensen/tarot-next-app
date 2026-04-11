"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/LoginForm";

export const Login = () => {
  const { data: session, status } = useSession();
  const t = useTranslations("ui");

  if (status === "loading" || session) return null;

  return (
    <section className="login">
      <div className="container">
        <h2 className="title title--secondary login__title">{t("stepThroughTheVeil")}</h2>
        <LoginForm />
      </div>
    </section>
  );
};