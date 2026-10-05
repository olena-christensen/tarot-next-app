/**
 * Keeps the finished round across sign-in. Google sign-in leaves the page, so
 * "Claim your moonstone" saves the end screen here first; back on the game page
 * the end screen is put back and the moonstone shows up in it.
 */
import type { Round } from "./index";

const KEY = "theveil_potion_claim";
const MAX_AGE_MS = 30 * 60 * 1000;

export type SavedClaim = { round: Round; startedAt: number; finishedAt: number; path: string };

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

/** Where Google sign-in should come back to: the game, while a claim is pending. */
export function claimReturnPath(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedClaim).path : null;
  } catch {
    return null;
  }
}
