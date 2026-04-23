import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { email } = await params;
  const decoded = decodeURIComponent(email).toLowerCase();

  const user = await prisma.user.findUnique({
    where: { collegeEmail: decoded },
    select: {
      collegeEmail: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      quote: true,
      response: { select: { answers: true, updatedAt: true } },
    },
  });

  if (!user) return apiError("User not found", 404);
  return apiSuccess(user);
}
