import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || session!.user.email;

  if (email !== session!.user.email && session!.user.role !== "ADMIN") {
    return apiError("Forbidden", 403);
  }

  const response = await prisma.response.findUnique({
    where: { collegeEmail: email },
  });

  return apiSuccess(response ?? { collegeEmail: email, answers: {} });
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { answers } = body;

  if (!answers || typeof answers !== "object") {
    return apiError("Invalid answers payload");
  }

  const email = session!.user.email;

  const response = await prisma.response.upsert({
    where: { collegeEmail: email },
    create: { collegeEmail: email, answers },
    update: { answers },
  });

  return apiSuccess(response);
}
