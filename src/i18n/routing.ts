import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "no", "ru", "uk", "tr"],
  defaultLocale: "en",
});
