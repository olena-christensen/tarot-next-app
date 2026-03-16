"use client";

import { useSession, signOut } from "next-auth/react";

export const UserProfile = () => {
  const { data: session } = useSession();

  const memberSince = session?.user?.createdAt
    ? new Date(session.user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="user-profile">
      <div className="user-profile__field">
        <span className="user-profile__label">Name</span>
        <span className="user-profile__value">
          {session?.user?.name || "Mystic One"}
        </span>
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
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Slip Into the Shadows
      </button>
    </div>
  );
};
