"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

type UserProfileProps = {
  onClose?: () => void;
};

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const { data: session, update } = useSession();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

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
      setError("Name cannot be empty");
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
        setError(data.error || "Failed to update name");
        return;
      }

      await update({ name: trimmed });
      setIsEditingName(false);
    } catch {
      setError("Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setError("");
  };

  return (
    <div className="user-profile">
      <div className="user-profile__field">
        <span className="user-profile__label">Name</span>
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
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                className="user-profile__edit-btn user-profile__edit-btn--cancel"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
            {error && <span className="user-profile__error">{error}</span>}
          </div>
        ) : (
          <span className="user-profile__value user-profile__value--editable" onClick={handleEditName}>
            {session?.user?.name || "Mystic One"}
          </span>
        )}
      </div>
      <div className="user-profile__field">
        <span className="user-profile__label">Email</span>
        <span className="user-profile__value">{session?.user?.email}</span>
      </div>
      {memberSince && (
        <div className="user-profile__field">
          <span className="user-profile__label">Member since</span>
          <span className="user-profile__value">{memberSince}</span>
        </div>
      )}
      <button
        className="btn user-profile__btn"
        onClick={() => {
          onClose?.();
          signOut({ callbackUrl: "/" });
        }}
      >
        Slip Into the Shadows
      </button>
    </div>
  );
};
