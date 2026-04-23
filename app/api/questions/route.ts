import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiError, apiSuccess } from "@/lib/api-helpers";
import { questionSchema } from "@/lib/validations";

export async function GET() {
  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return apiSuccess(questions);
}

import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  if (!body.slug) {
    body.slug = `q_${randomBytes(4).toString("hex")}`;
  }
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((e) => e.message).join(", "));
  }

  const existing = await prisma.question.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return apiError("A question with this slug already exists", 409);

  const question = await prisma.question.create({ data: parsed.data as any });
  return apiSuccess(question, 201);
}
