"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { type PlanId } from "@/lib/plans";

type UserProfileProps = {
  onClose?: () => void;
};

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const { data: session, update } = useSession();
  const t = useTranslations("ui");
  const tPlans = useTranslations("plans");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function checkPassword() {
      const res = await fetch("/api/user/password-status");
      if (res.ok) {
        const data = await res.json();
        setHasPassword(data.hasPassword);
      }
    }
    checkPassword();
  }, []);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch("/api/user/plan");
        if (res.ok) {
          const data = await res.json();
          setPlanId(data.planId as PlanId);
        }
      } catch {
        // silent — UI falls back to "—"
      }
    }
    loadPlan();
  }, []);

  const memberSince = session?.user?.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const handleEditName = () => {
    setNameInput(session?.user?.name || "");
    setError("");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError(t("nameCannotBeEmpty"));
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("failedToUpdateName"));
        return;
      }

      await update({ name: trimmed });
      setIsEditingName(false);
    } catch {
      setError(t("failedToUpdateName"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setError("");
  };

  const handleEditPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
    setIsEditingPassword(true);
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError(t("passwordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordsDoNotMatch"));
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || t("failedToUpdatePassword"));
        return;
      }

      setPasswordSuccess(t("passwordUpdated"));
      setHasPassword(true);
      setTimeout(() => {
        setIsEditingPassword(false);
        setPasswordSuccess("");
      }, 1500);
    } catch {
      setPasswordError(t("failedToUpdatePassword"));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setIsEditingPassword(false);
    setPasswordError("");
    setPasswordSuccess("");
  };

  return (
    <div className="user-profile">
      <div className="user-profile__field">
        <span className="user-profile__label">{t("name")}</span>
        {isEditingName ? (
          <div className="user-profile__edit">
            <input
              className="user-profile__input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") handleCancelEdit();
              }}
              maxLength={100}
              autoFocus
              disabled={isSaving}
            />
            <div className="user-profile__edit-actions">
              <button
                className="user-profile__edit-btn user-profile__edit-btn--save"
                onClick={handleSaveName}
                disabled={isSaving}
              >
                {isSaving ? t("saving") : t("save")}
              </button>
              <button
                className="user-profile__edit-btn user-profile__edit-btn--cancel"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                {t("cancel")}
              </button>
            </div>
            {error && <span className="user-profile__error">{error}</span>}
          </div>
        ) : (
          <span className="user-profile__value user-profile__value--editable" onClick={handleEditName}>
            {session?.user?.name || t("mysticOne")}
          </span>
        )}
      </div>
      <div className="user-profile__field">
        <span className="user-profile__label">{t("email")}</span>
        <span className="user-profile__value">{session?.user?.email}</span>
      </div>
      {memberSince && (
        <div className="user-profile__field">
          <span className="user-profile__label">{t("memberSince")}</span>
          <span className="user-profile__value">{memberSince}</span>
        </div>
      )}
      <div className="user-profile__field">
        <span className="user-profile__label">{t("currentPlan")}</span>
        <span className="user-profile__value">
          {planId ? tPlans(`${planId}.name`) : "—"}
          <Link
            href="/subscription"
            className="user-profile__upgrade"
            onClick={() => onClose?.()}
          >
            {"→ " + t("upgrade")}
          </Link>
        </span>
      </div>
      <div className="user-profile__field">
        <span className="user-profile__label">{t("password")}</span>
        {isEditingPassword ? (
          <div className="user-profile__edit">
            {hasPassword && (
              <input
                className="user-profile__input"
                type="password"
                placeholder={t("currentPasswordPlaceholder")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordSaving}
              />
            )}
            <input
              className="user-profile__input"
              type="password"
              placeholder={t("newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={passwordSaving}
              autoFocus
            />
            <input
              className="user-profile__input"
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePassword();
                if (e.key === "Escape") handleCancelPassword();
              }}
              disabled={passwordSaving}
            />
            <div className="user-profile__edit-actions">
              <button
                className="user-profile__edit-btn user-profile__edit-btn--save"
                onClick={handleSavePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? t("saving") : t("save")}
              </button>
              <button
                className="user-profile__edit-btn user-profile__edit-btn--cancel"
                onClick={handleCancelPassword}
                disabled={passwordSaving}
              >
                {t("cancel")}
              </button>
            </div>
            {passwordError && <span className="user-profile__error">{passwordError}</span>}
            {passwordSuccess && <span className="user-profile__success">{passwordSuccess}</span>}
          </div>
        ) : (
          <span className="user-profile__value user-profile__value--editable" onClick={handleEditPassword}>
            {hasPassword ? t("changePassword") : t("setPassword")}
          </span>
        )}
      </div>
      <button
        className="btn user-profile__btn"
        onClick={() => {
          onClose?.();
          signOut({ callbackUrl: "/" });
        }}
      >
        {t("slipIntoShadows")}
      </button>
    </div>
  );
};
