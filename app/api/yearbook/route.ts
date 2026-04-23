import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "alphabetical";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "24"));

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const orderBy =
    sort === "recent"
      ? [{ response: { updatedAt: "desc" as const } }]
      : [{ firstName: "asc" as const }, { lastName: "asc" as const }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        collegeEmail: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        quote: true,
        response: { select: { updatedAt: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return apiSuccess({ users, total, page, limit });
}
