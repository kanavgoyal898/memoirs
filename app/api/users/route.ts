import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiError, apiSuccess } from "@/lib/api-helpers";
import { createUserSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/hash";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { collegeEmail: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        collegeEmail: true,
        firstName: true,
        lastName: true,
        role: true,
        mustChangePassword: true,
        failedLoginAttempts: true,
        lockUntil: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  void session;

  return apiSuccess({ users, total, page, limit });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { collegeEmail, firstName, lastName, quote, password, role } = parsed.data;
  const normalized = collegeEmail.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { collegeEmail: normalized } });
  if (existing) return apiError("User already exists", 409);

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      collegeEmail: normalized,
      firstName,
      lastName,
      quote,
      passwordHash,
      role,
      mustChangePassword: true,
    },
    select: {
      collegeEmail: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  return apiSuccess(user, 201);
}
