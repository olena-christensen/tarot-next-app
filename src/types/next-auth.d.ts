import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    createdAt?: Date;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      createdAt?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    createdAt?: string;
  }
}
