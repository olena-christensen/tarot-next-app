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

  // The user's active recurring tier (FREE/MONTHLY/YEARLY), or null until the
  // `/api/user/plan` fetch resolves. SINGLE is a consumable credit, never a tier,
  // so it never reads as "current". Starting null (not "FREE") means no card is
  // marked "Current plan" during the pre-fetch window — avoiding the flash where
  // Free briefly claims to be the active plan before the real tier loads.
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    async function loadCurrentPlan() {
      try {
        const res = await fetch("/api/user/plan");
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.planId as PlanId);
        }
      } catch {
        // silent — stays on the FREE default
      }
    }
    loadCurrentPlan();
  }, []);

  const handleSubscribe = async (planId: PlanId) => {
    if (busyPlan) return;
    setBusyPlan(planId);
    setError(false);
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
            const cardClass = isPopular
              ? "subscription__card subscription__card--popular"
              : "subscription__card";

            // Free is never purchasable: it reads "Current plan" when it's the
            // active tier, otherwise "Included" (the user is on a higher tier).
            const label = isCurrent
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
                  {(tPlans.raw(`${plan.id}.features`) as string[]).map((feature) => (
                    <li key={feature} className="subscription__feature">
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="subscription__cta"
                  disabled={isFree || isCurrent || Boolean(busyPlan)}
                  aria-busy={isBusy}
                  onClick={
                    isFree || isCurrent ? undefined : () => handleSubscribe(plan.id)
                  }
                >
                  {label}
                </button>
              </article>
            );
          })}
        </div>

        {error && (
          <p className="subscription__error" role="alert">
            {t("paymentStartFailed")}
          </p>
        )}
      </div>
    </section>
  );
};
