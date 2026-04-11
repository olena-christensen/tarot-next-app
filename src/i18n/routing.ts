import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "no", "ru"],
  defaultLocale: "en",
});
