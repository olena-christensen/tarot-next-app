"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Skull from "../assets/svg/skull.svg";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Omit for a bare dialog — the close button stands on its own. */
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
  /** Narrower than the 740px default, for dialogs holding a single short control. */
  narrow?: boolean;
  /**
   * false = no close button and no close on backdrop click: the user must act
   * inside the dialog (used by the first-sign-in consent window).
   */
  dismissible?: boolean;
  /**
   * The dialog itself does not scroll: its head and the close button stay in
   * view and the dialog scrolls its own list (castle emporium and vault).
   */
  pinned?: boolean;
};

/** Open windows, oldest first: Esc closes only the one on top. */
const openStack: string[] = [];

export const Modal = ({ isOpen, onClose, title, children, wide, narrow, dismissible = true, pinned }: ModalProps) => {
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

  // Esc closes the window on top, as clicking outside does (Lena, 2026-10-14).
  const id = useId();
  // latest close handler, so a parent re-render never reorders the stack
  const closeRef = useRef({ onClose, dismissible });
  closeRef.current = { onClose, dismissible };
  useEffect(() => {
    if (!isOpen) return;
    openStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || openStack[openStack.length - 1] !== id) return;
      if (closeRef.current.dismissible) closeRef.current.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = openStack.lastIndexOf(id);
      if (i >= 0) openStack.splice(i, 1);
    };
  }, [isOpen, id]);

  if (!isOpen || typeof document === "undefined") return null;

  // Portal to body so the modal escapes any parent stacking context (e.g. the
  // fixed .tarot-modal) and layers globally above the overlay footer.
  return createPortal(
    <div className="modal" onClick={dismissible ? onClose : undefined}>
      <div
        className={`modal__content${wide ? " modal__content--wide" : ""}${narrow ? " modal__content--narrow" : ""}${pinned ? " modal__content--pinned" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {dismissible && (
          <button className="modal__close" onClick={onClose}>
            <Skull />
          </button>
        )}
        {title && <h2 className="title title--secondary modal__title">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body
  );
};
