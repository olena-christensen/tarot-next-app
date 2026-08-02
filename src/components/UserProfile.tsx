"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { type PlanId } from "@/lib/plans";
import { type ReaderId } from "@/lib/readers";
import { ReaderSelectionModal } from "@/components/ReaderSelectionModal";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { DeckSelector } from "@/components/DeckSelector";
import { Modal } from "@/components/Modal";
import EditIcon from "@/assets/svg/edit.svg";
import EyeIcon from "@/assets/svg/eye.svg";

const DELETE_CONFIRMATION_TOKEN = "DELETE";

// ISO date → dd/mm/yy
const formatDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  no: "Norsk",
  ru: "Русский",
  uk: "Українська",
  tr: "Türkçe",
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
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [credits, setCredits] = useState<number>(0);
  const [subSaving, setSubSaving] = useState(false);
  // Deck and reader are read straight from the session (reactive) so their editor
  // modals' update({ preferredX }) reflects here immediately — same as language via useLocale().
  const deckId = session?.user?.preferredDeck ?? null;
  const readerId = (session?.user?.preferredReader ?? null) as ReaderId | null;
  const [isReaderSelectOpen, setIsReaderSelectOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isDeckSelectOpen, setIsDeckSelectOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [langSelection, setLangSelection] = useState<string>(locale);
  const [localeSaving, setLocaleSaving] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarUrl = session?.user?.image ?? null;

  // Reading history is a paid feature — same "active tier" rule the API enforces.
  // Non-subscribers get the pricing modal instead of the page.
  const isSubscriber =
    (planId === "MONTHLY" || planId === "YEARLY") &&
    expiresAt !== null &&
    new Date(expiresAt).getTime() > Date.now();

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
          setExpiresAt(data.expiresAt ?? null);
          setAutoRenew(data.autoRenew ?? true);
          setCredits(data.readingCredits ?? 0);
        }
      } catch {
        // silent — UI falls back to "—"
      }
    }
    loadPlan();
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

  const handleOpenDeleteModal = () => {
    setDeleteConfirmInput("");
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setDeleteConfirmInput("");
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmInput !== DELETE_CONFIRMATION_TOKEN || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: DELETE_CONFIRMATION_TOKEN }),
      });

      const data = await res.json().catch(() => ({ ok: false }));

      if (!res.ok || !data.ok) {
        setDeleteError(t("deleteAccountError"));
        setIsDeleting(false);
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError(t("deleteAccountError"));
      setIsDeleting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after an error
    if (!file) return;

    setAvatarError("");
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setAvatarError(t("avatarBadType"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(t("avatarTooLarge"));
      return;
    }

    setAvatarUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const key =
          data.error === "too_large"
            ? "avatarTooLarge"
            : data.error === "bad_type"
              ? "avatarBadType"
              : "avatarUploadFailed";
        setAvatarError(t(key));
        return;
      }
      const { url } = await res.json();
      await update({ image: url });
    } catch {
      setAvatarError(t("avatarUploadFailed"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleOpenLanguage = () => {
    setLangSelection(locale);
    setIsLanguageOpen(true);
  };

  const handleSaveLanguage = async () => {
    if (langSelection === locale) {
      setIsLanguageOpen(false);
      return;
    }
    await handleSelectLocale(langSelection);
    setIsLanguageOpen(false);
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

  const handleToggleAutoRenew = async () => {
    if (subSaving) return;
    // Turning auto-renew OFF asks for confirmation; turning it back ON does not.
    if (autoRenew && !window.confirm(t("cancelSubscriptionConfirm"))) return;
    setSubSaving(true);
    try {
      const res = await fetch("/api/user/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRenew: !autoRenew }),
      });
      if (res.ok) {
        const data = await res.json();
        setAutoRenew(data.autoRenew);
      }
    } catch {
      // silent — user can retry
    } finally {
      setSubSaving(false);
    }
  };

  return (
    <div className="user-profile">
      <div className="user-profile__avatar-block">
        <div className="user-profile__avatar">
          <div className="user-profile__avatar-frame">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="user-profile__avatar-img"
              />
            ) : (
              <span className="user-profile__avatar-fallback" aria-hidden="true">
                {(session?.user?.name || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            className="user-profile__avatar-edit"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            aria-label={t("profilePictureAria")}
          >
            <EditIcon />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarChange}
            hidden
          />
        </div>
        <span className="user-profile__label">{t("profileAvatar")}</span>
        {avatarError && <span className="form__error">{avatarError}</span>}
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileName")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">
            {session?.user?.name || t("mysticOne")}
          </span>
          <button
            type="button"
            className="user-profile__edit-icon"
            onClick={handleEditName}
            aria-label={t("name")}
          >
            <EditIcon />
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileEmail")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">{session?.user?.email}</span>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profilePlan")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">
            {planId ? tPlans(`${planId}.name`) : "—"}
          </span>
          <button
            type="button"
            className="user-profile__edit-icon"
            onClick={() => setIsSubscriptionOpen(true)}
            aria-label={t("currentPlan")}
          >
            <EditIcon />
          </button>
        </span>
      </div>
      {/* Credits are meaningless on a paid tier — subscription readings are
          unlimited and never touch the balance, so don't show a count. */}
      {!isSubscriber && (
        <div className="user-profile__field user-profile__field--row">
          <span className="user-profile__label">{t("profileCredits")}</span>
          <span className="user-profile__value-group">
            <span className="user-profile__value">{credits}</span>
            <button
              type="button"
              className="user-profile__edit-icon"
              onClick={() => setIsSubscriptionOpen(true)}
              aria-label={t("credits")}
            >
              <EditIcon />
            </button>
          </span>
        </div>
      )}
      {(planId === "MONTHLY" || planId === "YEARLY") && (
        <div className="user-profile__field user-profile__field--row">
          <span className="user-profile__label">{t("renewal")}</span>
          <span className="user-profile__value-group">
            <span className="user-profile__value">
              {expiresAt ? formatDate(expiresAt) : "—"}
            </span>
            <button
              type="button"
              className="user-profile__edit-icon"
              onClick={handleToggleAutoRenew}
              disabled={subSaving}
              aria-label={autoRenew ? t("cancelSubscription") : t("resumeSubscription")}
            >
              <EditIcon />
            </button>
          </span>
        </div>
      )}
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileDeck")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">
            {deckId === "Rider-Waite" ? t("deckRiderWaite") :
             deckId === "Klimt" ? t("deckKlimt") :
             deckId === "Gothic-Vintage" ? t("deckGothicVintage") : "—"}
          </span>
          <button
            type="button"
            className="user-profile__edit-icon"
            onClick={() => setIsDeckSelectOpen(true)}
            aria-label={t("chooseDeck")}
          >
            <EditIcon />
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileReader")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">
            {readerId ? tReaders(`${readerId}.displayName`) : "—"}
          </span>
          <button
            type="button"
            className="user-profile__edit-icon"
            onClick={() => setIsReaderSelectOpen(true)}
            aria-label={t("chooseReader")}
          >
            <EditIcon />
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileHistory")}</span>
        <span className="user-profile__value-group">
          {isSubscriber ? (
            <>
              <span className="user-profile__value">{t("profileHistoryOpen")}</span>
              <button
                type="button"
                className="user-profile__edit-icon"
                onClick={() => router.push("/history")}
                aria-label={t("profileHistory")}
              >
                <EyeIcon />
              </button>
            </>
          ) : (
            // Free users can't open the ledger, so offer the upgrade instead of
            // an affordance that only ever leads to a paywall.
            <button
              type="button"
              className="user-profile__row-cta"
              onClick={() => setIsSubscriptionOpen(true)}
            >
              {t("beginInitiation")}
            </button>
          )}
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileLanguage")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">{LOCALE_NAMES[locale]}</span>
          <button
            type="button"
            className="user-profile__edit-icon"
            onClick={handleOpenLanguage}
            aria-label={t("language")}
          >
            <EditIcon />
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profilePassword")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">
            {hasPassword ? t("profileBreakSeal") : t("profileForgeSeal")}
          </span>
          <button
            type="button"
            className="user-profile__edit-icon"
            onClick={handleEditPassword}
            aria-label={t("password")}
          >
            <EditIcon />
          </button>
        </span>
      </div>
      <button
        className="btn user-profile__btn"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        {t("slipIntoShadows")}
      </button>
      <section className="user-profile__danger-zone">
        <h2 className="user-profile__danger-zone-title">
          {t("deleteAccountHeading")}
        </h2>
        <button
          type="button"
          className="user-profile__danger-zone-trigger"
          onClick={handleOpenDeleteModal}
        >
          {t("deleteAccountTrigger")}
        </button>
      </section>
      <ReaderSelectionModal
        isOpen={isReaderSelectOpen}
        onClose={() => setIsReaderSelectOpen(false)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
      />
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
      <Modal
        isOpen={isEditingName}
        onClose={handleCancelEdit}
        title={t("profileName")}
      >
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveName();
          }}
        >
          <div className="form__input-block">
            <label htmlFor="profile-name" className="form__label">
              {t("whatShallWeCallYou")}
            </label>
            <input
              id="profile-name"
              className="form__input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={100}
              autoFocus
              disabled={isSaving}
            />
          </div>
          {error && <div className="form__error">{error}</div>}
          <div className="form__input-block">
            <button type="submit" className="btn form__btn" disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              className="btn form__btn form__btn--google"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isEditingPassword}
        onClose={handleCancelPassword}
        title={hasPassword ? t("profileBreakSeal") : t("profileForgeSeal")}
      >
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSavePassword();
          }}
        >
          {hasPassword && (
            <div className="form__input-block">
              <label htmlFor="current-password" className="form__label">
                {t("currentPasswordPlaceholder")}
              </label>
              <input
                id="current-password"
                className="form__input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordSaving}
              />
            </div>
          )}
          <div className="form__input-block">
            <label htmlFor="new-password" className="form__label">
              {t("newPasswordPlaceholder")}
            </label>
            <input
              id="new-password"
              className="form__input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              autoFocus
              disabled={passwordSaving}
            />
          </div>
          <div className="form__input-block">
            <label htmlFor="confirm-password" className="form__label">
              {t("confirmPasswordPlaceholder")}
            </label>
            <input
              id="confirm-password"
              className="form__input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={passwordSaving}
            />
          </div>
          {passwordError && <div className="form__error">{passwordError}</div>}
          {passwordSuccess && <div className="form__success">{passwordSuccess}</div>}
          <div className="form__input-block">
            <button
              type="submit"
              className="btn form__btn"
              disabled={passwordSaving}
            >
              {passwordSaving ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              className="btn form__btn form__btn--google"
              onClick={handleCancelPassword}
              disabled={passwordSaving}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isDeckSelectOpen}
        onClose={() => setIsDeckSelectOpen(false)}
        title={t("profileDeck")}
        wide
      >
        <DeckSelector inModal />
      </Modal>
      <Modal
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        title={t("profileLanguage")}
      >
        <div className="options-modal">
          <ul className="options-modal__list list">
            {routing.locales.map((loc) => (
              <li key={loc} className="options-modal__item">
                <label className="options-modal__option">
                  <input
                    type="radio"
                    name="profile-language"
                    className="options-modal__radio-input"
                    checked={langSelection === loc}
                    onChange={() => setLangSelection(loc)}
                    disabled={localeSaving !== null}
                  />
                  <span className="options-modal__radio" aria-hidden="true" />
                  <span className="options-modal__option-label">{LOCALE_NAMES[loc]}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="options-modal__save"
            onClick={handleSaveLanguage}
            disabled={localeSaving !== null}
          >
            {localeSaving ? t("saving") : t("save")}
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t("deleteAccountTrigger")}
      >
        <div className="delete-account-modal">
          <p className="delete-account-modal__warning">
            {t("deleteAccountWarning")}
          </p>
          <label className="delete-account-modal__label" htmlFor="delete-confirm">
            {t("deleteAccountConfirmLabel")}
          </label>
          <input
            id="delete-confirm"
            className="delete-account-modal__input"
            type="text"
            value={deleteConfirmInput}
            onChange={(e) => setDeleteConfirmInput(e.target.value)}
            placeholder={t("deleteAccountConfirmPlaceholder")}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={isDeleting}
          />
          <div className="delete-account-modal__actions">
            <button
              type="button"
              className="delete-account-modal__cancel"
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
            >
              {t("deleteAccountCancel")}
            </button>
            <button
              type="button"
              className="delete-account-modal__confirm"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmInput !== DELETE_CONFIRMATION_TOKEN || isDeleting}
            >
              {isDeleting ? t("deleteAccountSubmitting") : t("deleteAccountButton")}
            </button>
          </div>
          {deleteError && (
            <p className="delete-account-modal__error">{deleteError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
};
