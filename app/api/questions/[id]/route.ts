import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return apiError("Question not found", 404);
  return apiSuccess(question);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return apiError("Question not found", 404);

  const hasResponses = await prisma.response.count();

  if (body.type && body.type !== question.type && hasResponses > 0) {
    return apiError("Cannot change question type after responses exist", 400);
  }

  const allowedUpdates: Record<string, unknown> = {};
  if (body.label !== undefined) allowedUpdates.label = body.label;
  if (body.description !== undefined) allowedUpdates.description = body.description;
  if (body.required !== undefined) allowedUpdates.required = body.required;
  if (body.order !== undefined) allowedUpdates.order = body.order;
  if (body.options !== undefined) allowedUpdates.options = body.options;
  if (body.validation !== undefined) allowedUpdates.validation = body.validation;
  if (body.config !== undefined) allowedUpdates.config = body.config;
  if (body.type !== undefined && hasResponses === 0) allowedUpdates.type = body.type;

  const updated = await prisma.question.update({ where: { id }, data: allowedUpdates });
  return apiSuccess(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return apiError("Question not found", 404);

  await prisma.question.update({ where: { id }, data: { isActive: false } });
  return apiSuccess({ message: "Question deactivated" });
}
