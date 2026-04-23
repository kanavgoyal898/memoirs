import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const post = await prisma.wallPost.findUnique({ where: { id } });
  if (!post) return apiError("Post not found", 404);

  const isOwner = post.uploadedBy === session!.user.email;
  const isAdmin = session!.user.role === "ADMIN";

  if (!isOwner && !isAdmin) return apiError("Forbidden", 403);

  await prisma.wallPost.delete({ where: { id } });
  return apiSuccess({ message: "Post deleted" });
}
