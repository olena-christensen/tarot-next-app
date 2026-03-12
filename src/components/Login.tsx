"use client";

import { useSession, signOut } from "next-auth/react";
import { LoginForm } from "@/components/LoginForm";

export const Login = () => {
  const { data: session, status } = useSession();

  return (
    <section className="login">
      <div className="container">
        {status === "loading" ? (
          <p className="title title--secondary login__title">Reading the stars...</p>
        ) : session ? (
          <>
            <h2 className="title title--secondary login__title">
              Welcome, {session.user?.name || "Mystic One"}
            </h2>
            <button
              className="btn form__btn"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Leave the Circle
            </button>
          </>
        ) : (
          <>
            <h2 className="title title--secondary login__title">Step Through the Veil</h2>
            <LoginForm />
          </>
        )}
      </div>
    </section>
  );
};
