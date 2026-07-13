import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// Fallback only. Live invoices set redirectUrl to /{locale}/payment/result
// (see create-invoice), so Mono normally lands users straight on the localized
// page. This unprefixed route still exists for safety — e.g. an invoice created
// before that change, or any redirect that drops the locale — and forwards to
// the default-locale page rather than duplicating the result UI.
export default function PaymentResultFallback() {
  redirect(`/${routing.defaultLocale}/payment/result`);
}
