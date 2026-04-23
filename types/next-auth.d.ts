import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      name: string;
      role: string;
      mustChangePassword: boolean;
    };
  }
  interface User {
    role: string;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    mustChangePassword: boolean;
  }
}
