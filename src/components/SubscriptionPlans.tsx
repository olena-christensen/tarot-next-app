"use client";

import { useState, useEffect } from "react";
import { PLAN_ORDER, PLANS, type Plan, type PlanId } from "@/lib/plans";
import { useTranslations, useLocale } from "next-intl";
import { useOpenLogin } from "@/components/LoginContext";

const intervalSuffix = (interval: Plan["interval"]): string => {
  switch (interval) {
    case "month":
      return "/mo";
    case "year":
      return "/yr";
    default:
      return "";
  }
};

type SubscriptionPlansProps = {
  showHeader?: boolean;
};

export const SubscriptionPlans = ({ showHeader = true }: SubscriptionPlansProps) => {
  const t = useTranslations("ui");
  const tPlans = useTranslations("plans");
  const locale = useLocale();
  const openLogin = useOpenLogin();

  // Which plan's invoice request is in flight (null = none). Disables that one
  // button and shows a busy label; other buttons stay clickable.
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState(false);
  // Distinct from `error`: an unverified address is a fixable state with its own
  // action, not a generic failure.
  const [needsVerify, setNeedsVerify] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  // The user's active recurring tier (FREE/MONTHLY/YEARLY), or null until the
  // `/api/user/plan` fetch resolves. SINGLE is a consumable credit, never a tier,
  // so it never reads as "current". Starting null (not "FREE") means no card is
  // marked "Current plan" during the pre-fetch window — avoiding the flash where
  // Free briefly claims to be the active plan before the real tier loads.
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);

  // Cancelling lives on the active tier's own card (see the CTA below), so the
  // renewal state has to be known here.
  const [autoRenew, setAutoRenew] = useState(true);
  const [renewSaving, setRenewSaving] = useState(false);

  useEffect(() => {
    async function loadCurrentPlan() {
      try {
        const res = await fetch("/api/user/plan");
        if (res.ok) {
          const data = await res.json();
          // Entitlement, not the raw enum. A lapsed subscriber still has
          // planId MONTHLY until the cron downgrades them — marking that card
          // "Current plan" also DISABLES it, so the Renew button led straight
          // to a dead end where the only plan they wanted was unbuyable.
          setCurrentPlan(data.isSubscriber ? (data.planId as PlanId) : "FREE");
          setAutoRenew(data.autoRenew ?? true);
        }
      } catch {
        // silent — stays on the FREE default
      }
    }
    loadCurrentPlan();
  }, []);

  const handleToggleAutoRenew = async () => {
    if (renewSaving) return;
    // Turning auto-renew OFF asks for confirmation; turning it back ON does not.
    if (autoRenew && !window.confirm(t("cancelSubscriptionConfirm"))) return;
    setRenewSaving(true);
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
      setRenewSaving(false);
    }
  };

  const handleSubscribe = async (planId: PlanId) => {
    if (busyPlan) return;
    setBusyPlan(planId);
    setError(false);
    setNeedsVerify(false);
    try {
      const res = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the current locale so the invoice's redirectUrl points at the
        // localized /{locale}/payment/result page (Mono's redirect carries none).
        body: JSON.stringify({ planId, locale }),
      });

      if (res.status === 401) {
        // Not signed in — hand off to the branded login modal instead of failing.
        openLogin();
        setBusyPlan(null);
        return;
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "email_not_verified") {
          setNeedsVerify(true);
          setBusyPlan(null);
          return;
        }
      }

      if (!res.ok) {
        setError(true);
        setBusyPlan(null);
        return;
      }

      const { pageUrl } = (await res.json()) as { pageUrl?: string };
      if (!pageUrl) {
        setError(true);
        setBusyPlan(null);
        return;
      }

      // Leave busyPlan set: the button stays in its busy state through the
      // full-page navigation to Mono's hosted payment page.
      window.location.assign(pageUrl);
    } catch {
      setError(true);
      setBusyPlan(null);
    }
  };

  return (
    <section className="subscription">
      <div className="container">
        {showHeader && (
          <header className="subscription__header">
            <h1 className="subscription__title">{t("chooseYourPath")}</h1>
            <p className="subscription__subtitle">
              {t("oneReadingAtATime")}
            </p>
          </header>
        )}

        <div className="subscription__grid">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            const isFree = plan.id === "FREE";
            const isPopular = plan.id === "MONTHLY";
            const isOneTime = plan.interval === "one-time";
            const isCurrent = plan.id === currentPlan;
            const suffix = intervalSuffix(plan.interval);
            const isBusy = busyPlan === plan.id;
            const cardClass = [
              "subscription__card",
              isPopular ? "subscription__card--popular" : "",
              isCurrent ? "subscription__card--current" : "",
            ]
              .filter(Boolean)
              .join(" ");

            // On the tier the user actually pays for, the CTA is the cancel /
            // resume control instead of a dead "Current plan" label — the card
            // is already marked current by its gold bead. The row on the profile
            // only routes here, so this must stay reachable.
            const isCancellable =
              isCurrent && (plan.id === "MONTHLY" || plan.id === "YEARLY");

            // Free is never purchasable: it reads "Current plan" when it's the
            // active tier, otherwise "Included" (the user is on a higher tier).
            const label = isCancellable
              ? renewSaving
                ? t("processingBtn")
                : autoRenew
                  ? t("cancelSubscription")
                  : t("resumeSubscription")
              : isCurrent
                ? t("currentPlanBtn")
                : isFree
                  ? t("includedBtn")
                  : isBusy
                    ? t("processingBtn")
                    : isOneTime
                      ? t("buyReadingBtn")
                      : t("subscribeBtn");

            return (
              <article key={plan.id} className={cardClass}>
                {isPopular && (
                  <span className="subscription__badge">{t("mostPopular")}</span>
                )}
                <h2 className="subscription__card-name">{tPlans(`${plan.id}.name`)}</h2>
                <div className="subscription__card-price">
                  {plan.priceLabel}
                  {suffix && (
                    <span className="subscription__card-interval">
                      {suffix}
                    </span>
                  )}
                </div>
                <ul className="subscription__features">
                  {(tPlans.raw(`${plan.id}.features`) as string[]).map(
                    (feature, i) => (
                      <li key={feature} className="subscription__feature">
                        {feature}
                        {plan.comingSoonFeatures?.includes(i) && (
                          <span className="subscription__soon">
                            {t("comingSoon")}
                          </span>
                        )}
                      </li>
                    )
                  )}
                </ul>
                <button
                  type="button"
                  className="subscription__cta"
                  disabled={
                    isCancellable
                      ? renewSaving
                      : isFree || isCurrent || Boolean(busyPlan)
                  }
                  aria-busy={isCancellable ? renewSaving : isBusy}
                  onClick={
                    isCancellable
                      ? handleToggleAutoRenew
                      : isFree || isCurrent
                        ? undefined
                        : () => handleSubscribe(plan.id)
                  }
                >
                  {label}
                </button>
              </article>
            );
          })}
        </div>

        {/*
          Required disclosure, not decoration: the price tags say euros but the
          card is charged in hryvnia (mono only fiscalizes 980 — see CCY_UAH).
          The customer's own bank converts it back, so the figure on their
          statement will not match the figure on this page exactly. Saying so
          before they pay is the difference between a rounding difference and a
          complaint.
        */}
        <p className="subscription__note">{t("chargedInHryvnia")}</p>

        {needsVerify && (
          <p className="subscription__error" role="alert">
            {verifySent ? t("verificationSent") : t("emailNotVerified")}{" "}
            {!verifySent && (
              <button
                type="button"
                className="subscription__inline-link"
                onClick={async () => {
                  await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locale }),
                  });
                  // The endpoint always answers ok — throttled and already-verified
                  // are indistinguishable on purpose — so this never reports failure.
                  setVerifySent(true);
                }}
              >
                {t("resendVerification")}
              </button>
            )}
          </p>
        )}

        {error && (
          <p className="subscription__error" role="alert">
            {t("paymentStartFailed")}
          </p>
        )}
      </div>
    </section>
  );
};
