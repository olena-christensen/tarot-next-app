"use client";

import { useSession } from "next-auth/react";
import { LoginForm } from "@/components/LoginForm";

export const Login = () => {
  const { data: session, status } = useSession();

  if (status === "loading" || session) return null;

  return (
    <section className="login">
      <div className="container">
        <h2 className="title title--secondary login__title">Step Through the Veil</h2>
        <LoginForm />
      </div>
    </section>
  );
};