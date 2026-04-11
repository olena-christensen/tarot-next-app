"use client";

import { PLAN_ORDER, PLANS, type Plan } from "@/lib/plans";
import { useTranslations } from "next-intl";

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
            const suffix = intervalSuffix(plan.interval);
            const cardClass = isPopular
              ? "subscription__card subscription__card--popular"
              : "subscription__card";

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
                  disabled
                  title={
                    isFree ? undefined : t("paymentsLaunchingSoon")
                  }
                >
                  {isFree ? t("currentPlanBtn") : t("comingSoon")}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
