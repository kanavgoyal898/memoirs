import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  quote: z.string().optional(),
  profileImage: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((e) => e.message).join(", "));
  }

  const email = session!.user.email;

  const updated = await prisma.user.update({
    where: { collegeEmail: email },
    data: parsed.data,
    select: {
      collegeEmail: true,
      firstName: true,
      lastName: true,
      quote: true,
      profileImage: true,
    },
  });

  return apiSuccess(updated);
}
