"use client";

import { useState } from "react";
import { PLAN_ORDER, PLANS, type Plan, type PlanId } from "@/lib/plans";
import { useTranslations } from "next-intl";
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
  const openLogin = useOpenLogin();

  // Which plan's invoice request is in flight (null = none). Disables that one
  // button and shows a busy label; other buttons stay clickable.
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState(false);

  const handleSubscribe = async (planId: PlanId) => {
    if (busyPlan) return;
    setBusyPlan(planId);
    setError(false);
    try {
      const res = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
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
            const suffix = intervalSuffix(plan.interval);
            const isBusy = busyPlan === plan.id;
            const cardClass = isPopular
              ? "subscription__card subscription__card--popular"
              : "subscription__card";

            const label = isFree
              ? t("currentPlanBtn")
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
                  disabled={isFree || Boolean(busyPlan)}
                  aria-busy={isBusy}
                  onClick={isFree ? undefined : () => handleSubscribe(plan.id)}
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
