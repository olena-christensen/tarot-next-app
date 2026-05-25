import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as any)
    ? requested!
    : routing.defaultLocale;

  const messages = {
    ...(await import(`../../messages/${locale}/ui.json`)).default,
    ...(await import(`../../messages/${locale}/cards.json`)).default,
    ...(await import(`../../messages/${locale}/readings.json`)).default,
    ...(await import(`../../messages/${locale}/plans.json`)).default,
    ...(await import(`../../messages/${locale}/legal.json`)).default,
    ...(await import(`../../messages/${locale}/seo.json`)).default,
    ...(await import(`../../messages/${locale}/contact.json`)).default,
  };

  return { locale, messages };
});
