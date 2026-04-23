import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.email = user.email;
      }
      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
