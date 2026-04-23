import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { computeProfileCompletion } from "@/lib/profile";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const email = session!.user.email;

  const [user, completion] = await Promise.all([
    prisma.user.findUnique({
      where: { collegeEmail: email },
      select: {
        collegeEmail: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        quote: true,
        role: true,
      },
    }),
    computeProfileCompletion(email),
  ]);

  if (!user) return apiError("User not found", 404);

  return apiSuccess({ ...user, completion });
}
