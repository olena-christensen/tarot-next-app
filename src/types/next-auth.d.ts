import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    createdAt?: Date;
    preferredDeck?: string;
    preferredReader?: string;
    preferredLocale?: string;
    dailyCardEmail?: boolean;
    readingReminder?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      createdAt?: string;
      preferredDeck?: string;
      preferredReader?: string;
      preferredLocale?: string;
      dailyCardEmail?: boolean;
      readingReminder?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    createdAt?: string;
    preferredDeck?: string;
    preferredReader?: string;
    preferredLocale?: string;
    dailyCardEmail?: boolean;
    readingReminder?: boolean;
    /** Epoch ms of the last successful "does this user still exist" check. */
    verifiedAt?: number;
  }
}
