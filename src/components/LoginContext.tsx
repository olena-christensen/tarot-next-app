"use client";

import { createContext, useContext } from "react";

/**
 * Lets descendants (e.g. SubscriptionPlans) open the app's branded login modal,
 * which is owned higher up by PageShell / HomePageClient. Defaults to a no-op so
 * consumers rendered without a provider simply do nothing instead of crashing.
 */
export const LoginContext = createContext<() => void>(() => {});

export const useOpenLogin = (): (() => void) => useContext(LoginContext);
