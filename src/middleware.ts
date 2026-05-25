import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/privacy" || pathname === "/terms") {
    return NextResponse.next();
  }

  const globalLocaleMatch = routing.locales
    .flatMap((loc) => ["/privacy", "/terms"].map((p) => ({ loc, target: p, full: `/${loc}${p}` })))
    .find(({ full }) => pathname === full);
  if (globalLocaleMatch) {
    const url = req.nextUrl.clone();
    url.pathname = globalLocaleMatch.target;
    return NextResponse.redirect(url);
  }

  const hasLocalePrefix = routing.locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  );

  if (!hasLocalePrefix) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const preferred = token?.preferredLocale as string | undefined;
    if (preferred && routing.locales.includes(preferred as any)) {
      const url = req.nextUrl.clone();
      url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
