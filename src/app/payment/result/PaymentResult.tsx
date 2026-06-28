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
// purchase, so we re-check server state for a short window before concluding.
const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 1000;

const creditLabel = (n: number): string =>
  `${n} reading credit${n === 1 ? "" : "s"}`;

export const PaymentResult = () => {
  const [phase, setPhase] = useState<Phase>("checking");
  const [status, setStatus] = useState<PlanStatus | null>(null);
  // What the user was buying — captured from pendingPlanId before the webhook
  // clears it on success. Lets us tailor the success copy (credit vs. tier).
  const productRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

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
  }, []);

  let title: string;
  let message: string;

  if (phase === "checking") {
    title = "Confirming your payment";
    message = "Hang tight — we're confirming your payment with the bank.";
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
    // processing
    title = "Still processing";
    message =
      "We haven't received confirmation yet. This can take a little while — your purchase will appear shortly. Check back in a moment.";
  }

  return (
    <main className="payment-result">
      <div className="payment-result__inner">
        {phase === "checking" && (
          <div className="payment-result__spinner" aria-hidden="true" />
        )}
        <h1 className="payment-result__title">{title}</h1>
        <p className="payment-result__message">{message}</p>
        {phase !== "checking" && (
          <a className="payment-result__link" href="/">
            Return to The Veil
          </a>
        )}
      </div>
    </main>
  );
};
