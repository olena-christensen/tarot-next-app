"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Skull from "../assets/svg/skull.svg";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
};

export const Modal = ({ isOpen, onClose, title, children, wide }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  // Portal to body so the modal escapes any parent stacking context (e.g. the
  // fixed .tarot-modal) and layers globally above the overlay footer.
  return createPortal(
    <div className="modal" onClick={onClose}>
      <div className={`modal__content${wide ? " modal__content--wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>
          <Skull />
        </button>
        <h2 className="title title--secondary modal__title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
};
