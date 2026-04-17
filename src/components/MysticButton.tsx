"use client";

import { type ButtonHTMLAttributes } from "react";

export const MysticButton = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={["mystic-btn", className].filter(Boolean).join(" ")}
  />
);
