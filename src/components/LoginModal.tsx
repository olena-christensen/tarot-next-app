"use client";

import { useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import Skull from "../assets/svg/skull.svg";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="login-modal" onClick={onClose}>
      <div className="login-modal__content" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal__close" onClick={onClose}>
          <Skull/>
        </button>
        <h2 className="title title--secondary login__title">Step Through the Veil</h2>
        <LoginForm />
      </div>
    </div>
  );
};
