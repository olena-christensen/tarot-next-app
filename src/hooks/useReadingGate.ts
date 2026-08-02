"use client";

import { useCallback } from "react";
import { useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/AppProvider";
import { pickRandomCards } from "@/utils";
import { generateReading } from "@/lib/generateReading";
import {
  evaluateAnonRead,
  ANON_STORAGE_KEY,
  type AnonReadingState,
} from "@/lib/anonReadingLimit";

type ReadingGateCallbacks = {
  /** Anonymous visitor hit their daily limit → open the login modal. */
  onBlockedAnon: () => void;
  /** Logged-in FREE user out of free readings and credits → open the subscription modal. */
  onBlockedFree: () => void;
};

function readAnonState(): AnonReadingState | null {
  try {
    const raw = localStorage.getItem(ANON_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.date === "string" && typeof parsed?.count === "number") {
      return parsed as AnonReadingState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeAnonState(state: AnonReadingState): void {
  try {
    localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / storage disabled — ignore; the soft limit is best-effort.
  }
}

export function useReadingGate({
  onBlockedAnon,
  onBlockedFree,
}: ReadingGateCallbacks) {
  const { data: session } = useSession();
  const { state, setState } = useAppContext();
  const messages = useMessages() as any;

  const beginReading = useCallback(async (): Promise<boolean> => {
    // Generate once — this exact text is both displayed and persisted.
    const chosenCards = pickRandomCards({ cards: state.tarots, count: 3 });
    const response = generateReading(
      chosenCards,
      messages,
      messages.ui?.drawThreeCards ?? "Draw three cards to receive your reading.",
      messages.ui?.spiritsUnclear ?? "The spirits are unclear. Please draw again.",
      state.selectedReader
    );

    // Mark the draw in-flight so the trigger (e.g. "Unveil Another Fate") can
    // disable itself until the gate resolves — a double-click can't fire two
    // draws. Cleared by commit() on success or setLoading(false) on a block.
    const setLoading = (isResponseLoading: boolean) =>
      setState((prev) => ({ ...prev, isResponseLoading }));
    setLoading(true);

    const commit = () => {
      setState((prev) => ({
        ...prev,
        chosenCards,
        response,
        isResponseLoading: false,
        resetFlipped: true,
        isPredictionReady: false,
      }));
    };

    // Anonymous: soft localStorage gate, 1/day.
    if (!session?.user) {
      const { allowed, next } = evaluateAnonRead(readAnonState(), new Date());
      if (!allowed) {
        setLoading(false);
        onBlockedAnon();
        return false;
      }
      writeAnonState(next);
      commit();
      return true;
    }

    // Logged-in: server-authoritative check-and-commit.
    try {
      const res = await fetch("/api/readings/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: chosenCards.map((c) => c.id),
          response,
          // Recorded so the ledger can say who spoke this reading.
          readerId: state.selectedReader,
        }),
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.allowed) {
          commit();
          return true;
        }
        setLoading(false);
        onBlockedFree();
        return false;
      }
      // Non-200 (e.g. 500): fail open — never block a legit reader on a blip.
      commit();
      return true;
    } catch {
      // Network error: fail open.
      commit();
      return true;
    }
  }, [
    session,
    state.tarots,
    state.selectedReader,
    messages,
    setState,
    onBlockedAnon,
    onBlockedFree,
  ]);

  return { beginReading };
}
