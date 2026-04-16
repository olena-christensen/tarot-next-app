import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    createdAt?: Date;
    preferredDeck?: string;
    preferredReader?: string;
    preferredLocale?: string;
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
  }
}
