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
import { Switch } from "@/components/Switch";
import { MysticButton } from "@/components/MysticButton";
import EditIcon from "@/assets/svg/edit.svg";
import EyeIcon from "@/assets/svg/eye.svg";
import EyeOffIcon from "@/assets/svg/eye-off.svg";

const DELETE_CONFIRMATION_TOKEN = "DELETE";

// Fixed length on purpose — dots matching the real address would leak how long
// it is to anyone reading over a shoulder.
const EMAIL_MASK = "••••••••••••";

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
  const [credits, setCredits] = useState<number>(0);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [dailySaving, setDailySaving] = useState(false);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [emailRevealed, setEmailRevealed] = useState(false);
  // Deck and reader are read straight from the session (reactive) so their editor
  // modals' update({ preferredX }) reflects here immediately — same as language via useLocale().
  const deckId = session?.user?.preferredDeck ?? null;
  const readerId = (session?.user?.preferredReader ?? null) as ReaderId | null;
  const dailyCardEmail = session?.user?.dailyCardEmail ?? false;
  const readingReminder = session?.user?.readingReminder ?? false;
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

  // `isSubscriber` comes from GET /api/user/plan (server-computed via
  // isActiveTier) — one definition of entitlement for the whole app.

  // A paid tier whose period has ended but which the renewal cron hasn't
  // downgraded yet. Without this the page contradicts itself — "Current plan:
  // Monthly" beside the free-user paywalls — so say plainly that it lapsed.
  const isLapsed =
    (planId === "MONTHLY" || planId === "YEARLY") && !isSubscriber;

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
          setCredits(data.readingCredits ?? 0);
          setIsSubscriber(Boolean(data.isSubscriber));
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

  const handleToggleDailyCard = async () => {
    if (dailySaving) return;
    setDailySaving(true);
    const next = !dailyCardEmail;
    try {
      const res = await fetch("/api/user/daily-card", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyCardEmail: next }),
      });
      if (res.ok) {
        // Persist first, then update the session — the row reads the value from
        // the session so it re-renders without a reload.
        await update({ dailyCardEmail: next });
      }
    } catch {
      // silent — user can retry
    } finally {
      setDailySaving(false);
    }
  };

  const handleToggleReminder = async () => {
    if (reminderSaving) return;
    setReminderSaving(true);
    const next = !readingReminder;
    try {
      const res = await fetch("/api/user/reading-reminder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingReminder: next }),
      });
      if (res.ok) {
        await update({ readingReminder: next });
      }
    } catch {
      // silent — user can retry
    } finally {
      setReminderSaving(false);
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
          <button
            type="button"
            className="user-profile__value-btn"
            onClick={handleEditName}
            aria-label={t("name")}
          >
            {session?.user?.name || t("mysticOne")}
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileEmail")}</span>
        <span className="user-profile__value-group">
          <span className="user-profile__value">
            {emailRevealed ? session?.user?.email : EMAIL_MASK}
          </span>
          <button
            type="button"
            className="user-profile__edit-icon"
            onClick={() => setEmailRevealed((v) => !v)}
            aria-label={emailRevealed ? t("conceal") : t("reveal")}
            title={emailRevealed ? t("conceal") : t("reveal")}
            aria-pressed={emailRevealed}
          >
            {emailRevealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profilePlan")}</span>
        <span className="user-profile__value-group">
          {isLapsed ? (
            // Once it has lapsed the tier name is noise — the only useful thing
            // left on this row is the way back.
            <button
              type="button"
              className="user-profile__row-cta"
              onClick={() => setIsSubscriptionOpen(true)}
            >
              {t("beginInitiation")}
            </button>
          ) : (
            // The tier name itself is the way to the pricing modal — no separate
            // pencil, no expiry date, and cancelling lives on that modal's card.
            <button
              type="button"
              className="user-profile__value-btn"
              onClick={() => setIsSubscriptionOpen(true)}
              aria-label={t("currentPlan")}
            >
              {planId ? tPlans(`${planId}.name`) : "—"}
            </button>
          )}
        </span>
      </div>
      {/* Credits are meaningless on a paid tier — subscription readings are
          unlimited and never touch the balance, so don't show a count. */}
      {!isSubscriber && (
        <div className="user-profile__field user-profile__field--row">
          <span className="user-profile__label">{t("profileCredits")}</span>
          <span className="user-profile__value-group">
            <button
              type="button"
              className="user-profile__value-btn"
              onClick={() => setIsSubscriptionOpen(true)}
              aria-label={t("credits")}
            >
              {credits}
            </button>
          </span>
        </div>
      )}
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileDeck")}</span>
        <span className="user-profile__value-group">
          <button
            type="button"
            className="user-profile__value-btn"
            onClick={() => setIsDeckSelectOpen(true)}
            aria-label={t("chooseDeck")}
          >
            {deckId === "Rider-Waite" ? t("deckRiderWaite") :
             deckId === "Klimt" ? t("deckKlimt") :
             deckId === "Gothic-Vintage" ? t("deckGothicVintage") : "—"}
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileReader")}</span>
        <span className="user-profile__value-group">
          <button
            type="button"
            className="user-profile__value-btn"
            onClick={() => setIsReaderSelectOpen(true)}
            aria-label={t("chooseReader")}
          >
            {readerId ? tReaders(`${readerId}.displayName`) : "—"}
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profileHistory")}</span>
        <span className="user-profile__value-group">
          {isSubscriber ? (
            <button
              type="button"
              className="user-profile__value-btn"
              onClick={() => router.push("/history")}
              aria-label={t("profileHistory")}
            >
              {t("profileHistoryOpen")}
            </button>
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
        <span className="user-profile__label">{t("profileDailyCard")}</span>
        <span className="user-profile__value-group">
          {isSubscriber ? (
            <Switch
              checked={dailyCardEmail}
              onChange={handleToggleDailyCard}
              disabled={dailySaving}
              label={t("profileDailyCard")}
              onLabel={t("profileDailyCardOn")}
              offLabel={t("profileDailyCardOff")}
            />
          ) : (
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
        <span className="user-profile__label">{t("profileReminder")}</span>
        <span className="user-profile__value-group">
          {isSubscriber ? (
            <Switch
              checked={readingReminder}
              onChange={handleToggleReminder}
              disabled={reminderSaving}
              label={t("profileReminder")}
              onLabel={t("profileReminderOn")}
              offLabel={t("profileReminderOff")}
            />
          ) : (
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
          <button
            type="button"
            className="user-profile__value-btn"
            onClick={handleOpenLanguage}
            aria-label={t("language")}
          >
            {LOCALE_NAMES[locale]}
          </button>
        </span>
      </div>
      <div className="user-profile__field user-profile__field--row">
        <span className="user-profile__label">{t("profilePassword")}</span>
        <span className="user-profile__value-group">
          <button
            type="button"
            className="user-profile__value-btn"
            onClick={handleEditPassword}
            aria-label={t("password")}
          >
            {hasPassword ? t("profileBreakSeal") : t("profileForgeSeal")}
          </button>
        </span>
      </div>
      <div className="user-profile__actions">
        {/* Same button as the one that leaves the reading screen, so "back to
            the app" looks the same wherever it appears. */}
        <MysticButton onClick={() => router.push("/")}>
          {t("backToSanctum")}
        </MysticButton>
        <button
          className="btn user-profile__btn"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          {t("slipIntoShadows")}
        </button>
      </div>
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
