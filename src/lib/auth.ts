import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const TERMS_CONSENT_COOKIE = "tarot_terms_consent";

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
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // When the adapter creates a new OAuth user, record terms acceptance
      // based on the short-lived consent cookie set on the client before the
      // OAuth redirect.
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
