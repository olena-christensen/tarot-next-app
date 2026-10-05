/**
 * Keeps the finished round across sign-in. Google sign-in leaves the page, so
 * "Claim your moonstone" saves the end screen here first; back on the game page
 * the end screen is put back and the moonstone shows up in it.
 */
import type { Round } from "./index";

const KEY = "theveil_potion_claim";
const MAX_AGE_MS = 30 * 60 * 1000;

export type SavedClaim = {
  round: Round;
  startedAt: number;
  finishedAt: number;
  path: string;
  decision?: "kept" | "sent" | null;
  roundId?: string | null;
};

export function saveClaim(claim: Omit<SavedClaim, "path">): void {
  try {
    const saved: SavedClaim = { ...claim, path: window.location.pathname };
    sessionStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Private mode: the moonstone is still added; only the end screen isn't restored.
  }
}

export function takeClaim(): SavedClaim | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const claim = JSON.parse(raw) as SavedClaim;
    if (!claim?.round?.placements || Date.now() - claim.finishedAt > MAX_AGE_MS) return null;
    return claim;
  } catch {
    return null;
  }
}

const RETURN_KEY = "theveil_potion_return";

/** A friend's gift page asks Google sign-in to come back to it. */
export function rememberReturnPath(): void {
  try {
    sessionStorage.setItem(RETURN_KEY, window.location.pathname);
  } catch {
    // Private mode: sign-in lands on the main page; the link still works after.
  }
}

/**
 * Where Google sign-in should come back to: the game while a claim is pending,
 * or the gift page a friend was taking a potion from.
 */
export function claimReturnPath(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return (JSON.parse(raw) as SavedClaim).path;
    const gift = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return gift;
  } catch {
    return null;
  }
}
