import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api-helpers";
import { wallPostSchema } from "@/lib/validations";

const RATE_LIMIT_PER_DAY = 5;

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  const [posts, total] = await Promise.all([
    prisma.wallPost.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, profileImage: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.wallPost.count(),
  ]);

  return apiSuccess({ posts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const email = session!.user.email;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.wallPost.count({
    where: {
      uploadedBy: email,
      createdAt: { gte: todayStart },
    },
  });

  if (todayCount >= RATE_LIMIT_PER_DAY) {
    return apiError(`Upload limit reached (${RATE_LIMIT_PER_DAY} posts per day)`, 429);
  }

  const body = await req.json();
  const parsed = wallPostSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((e) => e.message).join(", "));
  }

  const post = await prisma.wallPost.create({
    data: {
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption,
      uploadedBy: email,
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  return apiSuccess(post, 201);
}
