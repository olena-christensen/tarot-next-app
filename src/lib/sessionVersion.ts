import { prisma } from "@/lib/prisma";

// Ending other sign-ins (code review 2026-10-15, item 6).
//
// Sessions are signed cookies (JWT) that live up to 30 days, so nothing on the
// server could end one early: changing your password because someone else knows
// it left them signed in. Each account now carries `User.sessionVersion`; every
// session records the value at sign-in, and the jwt callback's existing
// five-minute re-read of the account ends any session that is behind.
//
// Bumped by: a password reset, a password change on the profile, and Google
// being linked into an account that already had a password (see below). The
// device that made the change signs in again with the new password, so only
// the OTHER sessions end.

/** Sessions issued before this existed carry no version; every row starts at 0. */
export function isSessionRevoked(tokenVersion: number | undefined, current: number): boolean {
  return (tokenVersion ?? 0) !== current;
}

/**
 * Google was just linked into an existing account. If that account had a
 * password, someone may have registered this address before its owner did —
 * the owner then verified it and signed in with Google, and the stranger's
 * password still worked. Erase the password and end every other session.
 * The owner keeps Google, or sets a new password through "forgot password".
 * Her call, 2026-10-16.
 */
export async function onGoogleLinked(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, password: { not: null } },
    data: { password: null, sessionVersion: { increment: 1 } },
  });
}
