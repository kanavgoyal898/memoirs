import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { changePasswordSchema } from "@/lib/validations";
import { comparePassword, hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((e) => e.message).join(", "));
  }

  const { currentPassword, newPassword } = parsed.data;
  const email = session!.user.email;

  const user = await prisma.user.findUnique({
    where: { collegeEmail: email },
    select: { passwordHash: true },
  });

  if (!user) return apiError("User not found", 404);

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) return apiError("Current password is incorrect", 401);

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { collegeEmail: email },
    data: { passwordHash, mustChangePassword: false },
  });

  return apiSuccess({ message: "Password changed successfully" });
}
