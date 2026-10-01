"use client";

import { useState, useEffect, useRef } from "react";
import { PLAN_ORDER, PLANS, type Plan, type PlanId } from "@/lib/plans";
import { useTranslations, useLocale } from "next-intl";
import { useOpenLogin } from "@/components/LoginContext";
import {
  MOONSTONE_PACKS,
  MOONSTONE_PACK_ORDER,
  type MoonstonePackId,
} from "@/lib/moonstones";
import MoonstoneIcon from "@/assets/svg/moonstone.svg";
import { Link } from "@/i18n/navigation";
import { isMoonstonePack } from "@/lib/moonstones";

// What a CTA on this page can buy: a recurring plan or a moonstone pack. Both
// go through the same create-invoice call.
type Purchasable = PlanId | MoonstonePackId;

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
  const [busyPlan, setBusyPlan] = useState<Purchasable | null>(null);
  const [error, setError] = useState(false);
  // Set while the user pays in mono's tab (or the monobank app): this tab then
  // shows the waiting screen and polls until the payment settles.
  const [waiting, setWaiting] = useState<{ product: Purchasable; pageUrl: string } | null>(null);
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

  const handleSubscribe = async (planId: Purchasable) => {
    if (busyPlan) return;
    setBusyPlan(planId);
    setError(false);
    setNeedsVerify(false);
    // Open mono's tab NOW, inside the click, so the browser does not block it as
    // a pop-up; it gets its address once the invoice exists. Paying in the
    // monobank app (QR / phone) never redirects any browser back to us, so the
    // user must keep a tab of ours that notices the payment by itself.
    const payWin = window.open("", "_blank");
    if (payWin) payWin.opener = null;
    const closePayWin = () => {
      if (payWin && !payWin.closed) payWin.close();
    };
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
        closePayWin();
        openLogin();
        setBusyPlan(null);
        return;
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data?.error === "email_not_verified") {
          closePayWin();
          setNeedsVerify(true);
          setBusyPlan(null);
          return;
        }
      }

      if (!res.ok) {
        closePayWin();
        setError(true);
        setBusyPlan(null);
        return;
      }

      const { pageUrl } = (await res.json()) as { pageUrl?: string };
      if (!pageUrl) {
        closePayWin();
        setError(true);
        setBusyPlan(null);
        return;
      }

      if (payWin && !payWin.closed) {
        payWin.location.href = pageUrl;
        setWaiting({ product: planId, pageUrl });
        setBusyPlan(null);
        return;
      }

      // Pop-up blocked: fall back to the old same-tab flow. Mono's redirect then
      // lands on /payment/result, which polls the same way.
      // Leave busyPlan set: the button stays busy through the navigation.
      window.location.assign(pageUrl);
    } catch {
      closePayWin();
      setError(true);
      setBusyPlan(null);
    }
  };

  if (waiting) {
    return (
      <PaymentWaiting
        product={waiting.product}
        pageUrl={waiting.pageUrl}
        onClose={() => setWaiting(null)}
      />
    );
  }

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
          Moonstones — a currency, not a step between tiers, so they sit in one
          compact row under the plans: title, pack dropdown, live price, Buy.
          Kept to a single row so the whole page fits one laptop screen.
        */}
        <MoonstoneBuyRow
          busy={busyPlan}
          disabled={Boolean(busyPlan)}
          onBuy={(id) => handleSubscribe(id)}
        />

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

type MoonstoneBuyRowProps = {
  busy: Purchasable | null;
  disabled: boolean;
  onBuy: (id: MoonstonePackId) => void;
};

// Custom listbox rather than a native <select>: the options carry the
// moonstone icon, which a native option cannot render.
function MoonstoneBuyRow({ busy, disabled, onBuy }: MoonstoneBuyRowProps) {
  const t = useTranslations("ui");
  const defaultPack =
    MOONSTONE_PACK_ORDER.find((id) => MOONSTONE_PACKS[id].highlight) ??
    MOONSTONE_PACK_ORDER[0];
  const [selected, setSelected] = useState<MoonstonePackId>(defaultPack);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pack = MOONSTONE_PACKS[selected];

  // Close on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="subscription__buy-row">
      <span className="subscription__buy-title">
        <MoonstoneIcon className="subscription__moonstone subscription__moonstone--title" aria-hidden="true" />
        {t("buyMoonstonesTitle")}
      </span>
      <div className="subscription__dd" ref={rootRef}>
        <button
          type="button"
          className="subscription__dd-btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("moonstonesPackLabel")}
          onClick={() => setOpen((v) => !v)}
        >
          <MoonstoneIcon className="subscription__moonstone" aria-hidden="true" />
          {pack.qty}
          <span className="subscription__dd-caret" aria-hidden="true">▾</span>
        </button>
        {open && (
          <ul className="subscription__dd-list" role="listbox" aria-label={t("moonstonesPackLabel")}>
            {MOONSTONE_PACK_ORDER.map((id) => (
              <li key={id} role="option" aria-selected={id === selected}>
                <button
                  type="button"
                  className={`subscription__dd-opt${id === selected ? " subscription__dd-opt--on" : ""}`}
                  onClick={() => {
                    setSelected(id);
                    setOpen(false);
                  }}
                >
                  <MoonstoneIcon className="subscription__moonstone" aria-hidden="true" />
                  {MOONSTONE_PACKS[id].qty}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="subscription__buy-price">€{pack.priceEur}</span>
      <button
        type="button"
        className="subscription__cta subscription__buy-cta"
        disabled={disabled}
        aria-busy={busy === selected}
        aria-label={t("buyMoonstonesAria", { count: pack.qty })}
        onClick={() => onBuy(selected)}
      >
        {busy === selected ? t("processingBtn") : t("buyMoonstonesBtn")}
      </button>
    </div>
  );
}

// ── Waiting for a payment made in mono's tab or the monobank app ──

type WaitPhase = "waiting" | "success" | "failed" | "slow";

// Every 4s for up to 15 minutes, then "still confirming" with a manual re-check.
// Bounded so an abandoned tab does not keep the database awake for the hour
// mono's invoice stays valid.
const WAIT_POLL_MS = 4000;
const WAIT_MAX_ATTEMPTS = 225;

type PaymentWaitingProps = {
  product: Purchasable;
  pageUrl: string;
  onClose: () => void;
};

function PaymentWaiting({ product, pageUrl, onClose }: PaymentWaitingProps) {
  const t = useTranslations("payment");
  const [phase, setPhase] = useState<WaitPhase>("waiting");
  const [credits, setCredits] = useState(0);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setPhase("waiting");

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/user/plan", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.paymentStatus === "success") {
            setCredits(data.readingCredits ?? 0);
            setPhase("success");
            return;
          }
          if (["failure", "reversed", "expired"].includes(data.paymentStatus)) {
            setPhase("failed");
            return;
          }
        }
      } catch {
        // Network hiccup — try again on the next tick.
      }
      if (cancelled) return;
      if (attempts >= WAIT_MAX_ATTEMPTS) {
        setPhase("slow");
        return;
      }
      timer = setTimeout(poll, WAIT_POLL_MS);
    };

    timer = setTimeout(poll, WAIT_POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [nonce]);

  const isPack = isMoonstonePack(product);

  return (
    <div className="payment-result payment-result--inline" role="status" aria-live="polite">
      <div className="payment-result__inner">
        {phase === "waiting" && (
          <>
            <div className="payment-result__spinner" aria-hidden="true" />
            <h2 className="payment-result__title">{t("waitingTitle")}</h2>
            <p className="payment-result__message">{t("waitingMessage")}</p>
            <div className="payment-result__actions">
              <button
                type="button"
                className="payment-result__text-link"
                onClick={() => window.open(pageUrl, "_blank", "noopener")}
              >
                {t("reopenPayment")}
              </button>
              <button type="button" className="payment-result__text-link" onClick={onClose}>
                {t("cancelWaiting")}
              </button>
            </div>
          </>
        )}

        {phase === "success" && (
          <>
            {isPack && (
              <MoonstoneIcon className="payment-result__icon" aria-hidden="true" />
            )}
            <h2 className="payment-result__title">
              {isPack ? t("creditAddedTitle") : t("subActiveTitle")}
            </h2>
            <p className="payment-result__message">
              {isPack
                ? t("creditAddedMessage", { count: credits })
                : product === "YEARLY"
                  ? t("subActiveYearly")
                  : t("subActiveMonthly")}
            </p>
            <Link className="payment-result__link" href="/">
              {t("backToCards")}
            </Link>
          </>
        )}

        {phase === "failed" && (
          <>
            <h2 className="payment-result__title">{t("failedTitle")}</h2>
            <p className="payment-result__message">{t("failedMessage")}</p>
            <button
              type="button"
              className="payment-result__link payment-result__link--button"
              onClick={onClose}
            >
              {t("tryAgain")}
            </button>
          </>
        )}

        {phase === "slow" && (
          <>
            <h2 className="payment-result__title">{t("processingTitle")}</h2>
            <p className="payment-result__message">{t("processingMessage")}</p>
            <button
              type="button"
              className="payment-result__link payment-result__link--button"
              onClick={() => setNonce((n) => n + 1)}
            >
              {t("checkAgain")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
