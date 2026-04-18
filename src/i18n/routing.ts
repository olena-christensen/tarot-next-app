import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "no", "uk", "tr", "ru"],
  defaultLocale: "en",
});
