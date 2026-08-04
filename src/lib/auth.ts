import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  clearRateLimit,
  clientIp,
  consumeRateLimit,
  LOGIN_BY_EMAIL,
  LOGIN_BY_IP,
} from "./rateLimit";

export const TERMS_CONSENT_COOKIE = "tarot_terms_consent";
export const AGE_CONSENT_COOKIE = "tarot_age_consent";

/**
 * How often a live session re-confirms its user row still exists.
 * With `strategy: "jwt"` nothing reads the DB per request, so a row deleted
 * out-of-band (admin action, GDPR erasure, ban) would otherwise keep working
 * until the token expired. This bounds that window without adding a query to
 * every session read.
 */
const USER_VERIFY_INTERVAL_MS = 5 * 60 * 1000;

/**
 * How long a session survives when "remember me" was NOT ticked.
 *
 * `session.maxAge` is static config and cannot vary per sign-in, so the choice
 * rides on the token instead: an absolute deadline stamped at login and checked
 * on every read. Past it the jwt callback throws, which is the same mechanism
 * that already evicts deleted users — NextAuth v4 catches it, logs
 * JWT_SESSION_ERROR and clears the cookie.
 */
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any) as NextAuthOptions["adapter"],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        // NextAuth v4 hands the raw request in as the second argument; its
        // headers are the only place the client IP is available here.
        const ip = clientIp(new Headers((req?.headers ?? {}) as HeadersInit));

        // Both axes are consumed BEFORE bcrypt. The hash is deliberately slow
        // (cost 12, ~250ms of CPU), so letting an unthrottled flood reach it is
        // itself the denial-of-service — the throttle has to sit in front of it,
        // not behind it.
        const [byIp, byEmail] = await Promise.all([
          consumeRateLimit(`login:ip:${ip}`, LOGIN_BY_IP),
          consumeRateLimit(`login:email:${email}`, LOGIN_BY_EMAIL),
        ]);
        if (byIp.blocked || byEmail.blocked) {
          // A distinct error so the form can say "too many attempts" instead of
          // "wrong password", which would send people off resetting a password
          // that was never wrong.
          throw new Error("rate_limited");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        // Right phrase: forget the failures. Someone who mistyped four times and
        // then got in shouldn't stay one slip away from a lockout.
        await clearRateLimit(`login:email:${email}`);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          preferredDeck: user.preferredDeck,
          preferredReader: user.preferredReader,
          preferredLocale: user.preferredLocale,
          dailyCardEmail: user.dailyCardEmail,
          readingReminder: user.readingReminder,
          // Arrives as a string over the credentials transport.
          rememberMe: credentials.rememberMe === "true",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id;
        token.createdAt = user.createdAt
          ? new Date(user.createdAt).toISOString()
          : undefined;
        token.preferredDeck = user.preferredDeck ?? "Rider-Waite";
        token.preferredReader = user.preferredReader ?? "vespera";
        token.preferredLocale = user.preferredLocale ?? "en";
        token.dailyCardEmail = user.dailyCardEmail ?? false;
        token.readingReminder = user.readingReminder ?? false;
        // Google sign-in has no checkbox to carry, so it is always remembered.
        const remembered = user.rememberMe !== false;
        token.sessionExpiresAt = remembered
          ? null
          : Date.now() + SHORT_SESSION_MS;
      }

      // Absolute deadline for a not-remembered session. Checked before anything
      // else so an expired token can't be refreshed back to life.
      if (
        typeof token.sessionExpiresAt === "number" &&
        Date.now() > token.sessionExpiresAt
      ) {
        throw new Error("session_expired");
      }
      if (trigger === "update") {
        if (updateData?.name) {
          token.name = updateData.name;
        }
        if (updateData?.preferredDeck) {
          token.preferredDeck = updateData.preferredDeck;
        }
        if (updateData?.preferredReader) {
          token.preferredReader = updateData.preferredReader;
        }
        if (updateData?.preferredLocale) {
          token.preferredLocale = updateData.preferredLocale;
        }
        if (updateData?.image !== undefined) {
          token.picture = updateData.image;
        }
        // Boolean: must test for presence, not truthiness — a truthy check would
        // silently drop every "switch it off".
        if (updateData?.dailyCardEmail !== undefined) {
          token.dailyCardEmail = updateData.dailyCardEmail;
        }
        if (updateData?.readingReminder !== undefined) {
          token.readingReminder = updateData.readingReminder;
        }
      }

      const now = Date.now();
      if (user) {
        // Just signed in — the row was read moments ago by the provider.
        token.verifiedAt = now;
      } else if (
        token.id &&
        now - (token.verifiedAt ?? 0) > USER_VERIFY_INTERVAL_MS
      ) {
        let fresh: {
          id: string;
          name: string | null;
          image: string | null;
          preferredDeck: string;
          preferredReader: string;
          preferredLocale: string;
          dailyCardEmail: boolean;
          readingReminder: boolean;
        } | null;
        try {
          // Same query that answers "do you still exist", widened to re-read the
          // mutable profile fields. A JWT session is otherwise frozen at login,
          // so a change made in one browser (e.g. an avatar uploaded on prod)
          // never reaches another — this syncs them within the interval at no
          // extra query cost.
          fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              id: true,
              name: true,
              image: true,
              preferredDeck: true,
              preferredReader: true,
              preferredLocale: true,
              dailyCardEmail: true,
              readingReminder: true,
            },
          });
        } catch (err) {
          // A DB blip must not sign everyone out — keep the session and retry
          // on the next session read.
          console.error("[auth] user refresh failed", err);
          return token;
        }
        if (!fresh) {
          // Throwing is how NextAuth v4 invalidates a JWT session: the session
          // route catches it, logs JWT_SESSION_ERROR and clears the cookie.
          throw new Error("user_no_longer_exists");
        }
        // The DB is authoritative: every writer (avatar upload, rename, each
        // preference PATCH) persists before calling update(), so a value here is
        // never staler than the token's.
        token.name = fresh.name ?? token.name;
        token.picture = fresh.image;
        token.preferredDeck = fresh.preferredDeck;
        token.preferredReader = fresh.preferredReader;
        token.preferredLocale = fresh.preferredLocale;
        token.dailyCardEmail = fresh.dailyCardEmail;
        token.readingReminder = fresh.readingReminder;
        token.verifiedAt = now;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.createdAt = token.createdAt;
        if (token.name) {
          session.user.name = token.name as string;
        }
        session.user.preferredDeck = token.preferredDeck as string | undefined;
        session.user.preferredReader = token.preferredReader as string | undefined;
        session.user.preferredLocale = token.preferredLocale as string | undefined;
        session.user.dailyCardEmail = token.dailyCardEmail as boolean | undefined;
        session.user.readingReminder = token.readingReminder as boolean | undefined;
        // Keep the avatar reactive to update({ image }) — token.picture is the
        // NextAuth-standard slot the jwt callback writes on an avatar change.
        session.user.image = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // When the adapter creates a new OAuth user, record terms acceptance
      // based on the short-lived consent cookie set on the client before the
      // OAuth redirect. The age cookie (AGE_CONSENT_COOKIE) is also set on
      // the client; a corresponding ageAcceptedAt column would need a Prisma
      // migration to persist it server-side.
      try {
        const consent = cookies().get(TERMS_CONSENT_COOKIE)?.value;
        if (consent === "1") {
          await prisma.user.update({
            where: { id: user.id },
            data: { termsAcceptedAt: new Date() },
          });
        }
      } catch {
        // cookies() may be unavailable outside a request context — ignore.
      }
    },
  },
  pages: {
    signIn: "/",
  },
};
