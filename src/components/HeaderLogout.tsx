"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import DoorOutIcon from "@/assets/svg/door-out.svg";

/** Signed-in log-out door beside the avatar. Same call as the profile's sign-out. */
export const HeaderLogout = () => {
  const t = useTranslations("ui");
  const label = t("slipIntoShadows");

  return (
    <span className="header-tip header-tip--end" data-tip={label}>
      <button
        type="button"
        className="header-icon"
        aria-label={label}
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <DoorOutIcon aria-hidden="true" />
      </button>
    </span>
  );
};
