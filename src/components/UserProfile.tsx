"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { type PlanId } from "@/lib/plans";
import { type ReaderId } from "@/lib/readers";
import { ReaderSelectionModal } from "@/components/ReaderSelectionModal";

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  no: "Norsk",
  ru: "Русский",
};

export const UserProfile = () => {
  const { data: session, update } = useSession();
  const t = useTranslations("ui");
  const tPlans = useTranslations("plans");
  const tReaders = useTranslations("readers");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [readerId, setReaderId] = useState<ReaderId | null>(null);
  const [isReaderSelectOpen, setIsReaderSelectOpen] = useState(false);
  const [localeSaving, setLocaleSaving] = useState<string | null>(null);
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

  useEffect(() => {
    async function loadReader() {
      try {
        const res = await fetch("/api/user/reader");
        if (res.ok) {
          const data = await res.json();
          setReaderId(data.reader as ReaderId);
        }
      } catch {
        // silent — UI falls back to "—"
      }
    }
    loadReader();
  }, []);

  useEffect(() => {
    async function loadDeck() {
      try {
        const res = await fetch("/api/user/deck");
        if (res.ok) {
          const data = await res.json();
          setDeckId(data.deck);
        }
      } catch {
        // silent — UI falls back to "—"
      }
    }
    loadDeck();
  }, []);

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

  const handleSelectLocale = async (loc: string) => {
    if (loc === locale || localeSaving) return;
    setLocaleSaving(loc);
    try {
      const res = await fetch("/api/user/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: loc }),
      });
      if (res.ok) {
        await update({ preferredLocale: loc });
        router.replace(pathname, { locale: loc });
      }
    } catch {
      // silent — user can retry
    } finally {
      setLocaleSaving(null);
    }
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
      <div className="user-profile__field">
        <span className="user-profile__label">{t("currentPlan")}</span>
        <span className="user-profile__value">
          {planId ? tPlans(`${planId}.name`) : "—"}
          <Link href="/subscription" className="user-profile__upgrade">
            {"→ " + t("initiation")}
          </Link>
        </span>
      </div>
      <div className="user-profile__field">
        <span className="user-profile__label">{t("deck")}</span>
        <span className="user-profile__value">
          {deckId === "Rider-Waite" ? t("deckRiderWaite") :
           deckId === "Klimt" ? t("deckKlimt") :
           deckId === "Gothic-Vintage" ? t("deckGothicVintage") : "—"}
          <Link href="/decks" className="user-profile__upgrade">
            {"→ " + t("chooseDeck")}
          </Link>
        </span>
      </div>
      <div className="user-profile__field">
        <span className="user-profile__label">{t("reader")}</span>
        <span className="user-profile__value">
          {readerId ? tReaders(`${readerId}.displayName`) : "—"}
          <button
            type="button"
            className="user-profile__upgrade"
            onClick={() => setIsReaderSelectOpen(true)}
          >
            {"→ " + t("chooseReader")}
          </button>
        </span>
      </div>
      <div className="user-profile__field">
        <span className="user-profile__label">{t("language")}</span>
        <div className="user-profile__language-options">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              className={`user-profile__language-option${loc === locale ? " user-profile__language-option--active" : ""}`}
              onClick={() => handleSelectLocale(loc)}
              disabled={localeSaving !== null}
            >
              {LOCALE_NAMES[loc]}
            </button>
          ))}
        </div>
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
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        {t("slipIntoShadows")}
      </button>
      <ReaderSelectionModal
        isOpen={isReaderSelectOpen}
        onClose={() => setIsReaderSelectOpen(false)}
        onOpenSubscription={() => router.push("/subscription")}
      />
    </div>
  );
};
