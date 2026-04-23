import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiError, apiSuccess } from "@/lib/api-helpers";
import { adminResetPasswordSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = adminResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { email, newPassword } = parsed.data;
  const normalized = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { collegeEmail: normalized } });
  if (!user) return apiError("User not found", 404);

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { collegeEmail: normalized },
    data: {
      passwordHash,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
  });

  return apiSuccess({ message: "Password reset successfully" });
}
