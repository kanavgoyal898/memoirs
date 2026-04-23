import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { collegeEmail: normalizedEmail },
          select: {
            collegeEmail: true,
            firstName: true,
            lastName: true,
            passwordHash: true,
            mustChangePassword: true,
            failedLoginAttempts: true,
            lockUntil: true,
            role: true,
          },
        });

        if (!user) return null;

        if (user.lockUntil && user.lockUntil > new Date()) {
          return null;
        }

        const valid = await comparePassword(password, user.passwordHash);

        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await prisma.user.update({
            where: { collegeEmail: normalizedEmail },
            data: {
              failedLoginAttempts: attempts,
              ...(lockUntil ? { lockUntil } : {}),
            },
          });
          return null;
        }

        await prisma.user.update({
          where: { collegeEmail: normalizedEmail },
          data: { failedLoginAttempts: 0, lockUntil: null },
        });

        return {
          id: user.collegeEmail,
          email: user.collegeEmail,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
});
