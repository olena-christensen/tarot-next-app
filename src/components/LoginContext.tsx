"use client";

import { createContext, useContext } from "react";

/**
 * Lets descendants (e.g. SubscriptionPlans) open the app's branded login modal,
 * which is owned higher up by SiteChrome (or PageShell outside the locale
 * pages). An optional line explains why it opened. Defaults to a no-op so
 * consumers rendered without a provider simply do nothing instead of crashing.
 */
export const LoginContext = createContext<(notice?: string) => void>(() => {});

export const useOpenLogin = (): ((notice?: string) => void) => useContext(LoginContext);
