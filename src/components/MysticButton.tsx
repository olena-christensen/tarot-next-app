"use client";

import { type ButtonHTMLAttributes } from "react";

interface MysticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  locked?: boolean;
}

export const MysticButton = ({ className, locked, ...props }: MysticButtonProps) => (
  <button
    {...props}
    className={[
      "mystic-btn",
      locked ? "mystic-btn--locked" : "",
      className,
    ].filter(Boolean).join(" ")}
  />
);
