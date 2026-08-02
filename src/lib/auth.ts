import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          preferredDeck: user.preferredDeck,
          preferredReader: user.preferredReader,
          preferredLocale: user.preferredLocale,
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
