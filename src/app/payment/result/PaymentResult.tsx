"use client";

import { useEffect, useRef, useState } from "react";

type PlanStatus = {
  planId: "FREE" | "SINGLE" | "MONTHLY" | "YEARLY";
  readingCredits: number;
  paymentStatus: string | null;
  pendingPlanId: string | null;
};

type Phase = "checking" | "success" | "failed" | "processing" | "signedOut";

// The browser redirect from Mono races the webhook that actually activates the
// purchase. We stay in the "confirming" state (no Return link) for this whole
// window so a paid user can't return to the app and get shown an upsell before
// their credit/tier is applied. ~60s comfortably covers a slow webhook; in
// production confirmation is usually seconds. If it still hasn't settled, we
// fall to "processing" with a Check-again button rather than trapping them.
const MAX_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 2000;

const creditLabel = (n: number): string =>
  `${n} reading credit${n === 1 ? "" : "s"}`;

export const PaymentResult = () => {
  const [phase, setPhase] = useState<Phase>("checking");
  const [status, setStatus] = useState<PlanStatus | null>(null);
  // Bumped by "Check again" to restart the polling window from scratch.
  const [recheckNonce, setRecheckNonce] = useState(0);
  // What the user was buying — captured from pendingPlanId before the webhook
  // clears it on success. Lets us tailor the success copy (credit vs. tier).
  const productRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Restarts (Check again) re-enter the confirming state and poll afresh.
    setPhase("checking");

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/user/plan", { cache: "no-store" });
        if (cancelled) return;

        if (res.status === 401) {
          setPhase("signedOut");
          return;
        }

        if (res.ok) {
          const data = (await res.json()) as PlanStatus;
          if (cancelled) return;
          setStatus(data);
          if (data.pendingPlanId) productRef.current = data.pendingPlanId;

          if (data.paymentStatus === "success") {
            setPhase("success");
            return;
          }
          if (
            data.paymentStatus === "failure" ||
            data.paymentStatus === "reversed"
          ) {
            setPhase("failed");
            return;
          }
        }
        // Not settled yet (or a transient non-OK response) — keep polling.
      } catch {
        // Network hiccup — fall through and retry until attempts run out.
      }

      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setPhase("processing");
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [recheckNonce]);

  let title: string;
  let message: string;

  if (phase === "checking") {
    title = "Confirming your payment";
    message =
      "Hang tight — we're confirming your payment with the bank. This can take a moment; please don't close this page.";
  } else if (phase === "success") {
    const product = productRef.current;
    if (product === "SINGLE") {
      title = "Reading credit added";
      message = `Your payment is confirmed. You now have ${creditLabel(
        status?.readingCredits ?? 0
      )}.`;
    } else if (product === "MONTHLY" || product === "YEARLY") {
      title = "Subscription active";
      message = `Your ${product === "YEARLY" ? "yearly" : "monthly"} subscription is now active. Enjoy The Veil.`;
    } else if (status && status.planId !== "FREE") {
      // The webhook beat our first poll, so we lost the pending product — fall
      // back to describing the current entitlement.
      title = "Payment confirmed";
      message = `Your ${status.planId === "YEARLY" ? "yearly" : "monthly"} subscription is active.`;
    } else {
      title = "Payment confirmed";
      message = status
        ? `Your payment is confirmed. You have ${creditLabel(status.readingCredits)}.`
        : "Your payment is confirmed.";
    }
  } else if (phase === "failed") {
    title = "Payment not completed";
    message =
      "Your payment didn't go through, so nothing was charged. You can try again whenever you're ready.";
  } else if (phase === "signedOut") {
    title = "Sign in to view your payment";
    message =
      "We couldn't read your account. Sign in to The Veil to see your latest status.";
  } else {
    // processing — confirmation is taking longer than usual. Be explicit that
    // the purchase is still going through and the entitlement appears on its
    // own, so the user neither pays again nor expects a reading to be ready yet.
    title = "Still confirming";
    message =
      "Your payment is still being confirmed by the bank — this can take a little while. Your purchase will be applied automatically once it clears, and you won't be charged again. Check again below, or come back shortly; if you start a reading before it clears you may briefly be asked to subscribe — just try again in a moment.";
  }

  return (
    <main className="payment-result">
      <div className="payment-result__inner">
        {phase === "checking" && (
          <div className="payment-result__spinner" aria-hidden="true" />
        )}
        <h1 className="payment-result__title">{title}</h1>
        <p className="payment-result__message">{message}</p>
        {phase === "processing" && (
          <button
            type="button"
            className="payment-result__link payment-result__link--button"
            onClick={() => setRecheckNonce((n) => n + 1)}
          >
            Check again
          </button>
        )}
        {phase !== "checking" && (
          <a className="payment-result__link" href="/">
            Return to The Veil
          </a>
        )}
      </div>
    </main>
  );
};
