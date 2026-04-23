import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, apiError, apiSuccess } from "@/lib/api-helpers";
import { parseCsvFile, deduplicateCsvRows } from "@/lib/csv";
import { hashPassword } from "@/lib/hash";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return apiError("No file provided");
  if (!file.name.endsWith(".csv")) return apiError("File must be a CSV");
  if (file.size > 1024 * 1024) return apiError("File too large (max 1MB)");

  const content = await file.text();
  const { valid, errors } = parseCsvFile(content);
  const deduplicated = deduplicateCsvRows(valid);

  const results = { created: 0, updated: 0, failed: errors.length, errors };

  for (const row of deduplicated) {
    try {
      const existing = await prisma.user.findUnique({ where: { collegeEmail: row.email } });
      if (existing) {
        continue;
      }

      const passwordHash = await hashPassword(row.password);
      await prisma.user.create({
        data: {
          collegeEmail: row.email,
          firstName: "",
          lastName: "",
          quote: "",
          passwordHash,
          role: row.role as "ADMIN" | "USER",
          mustChangePassword: true,
        },
      });
      results.created++;
    } catch {
      results.failed++;
      results.errors.push({
        row: -1,
        data: { email: row.email },
        errors: ["Database error"],
      });
    }
  }

  return apiSuccess(results);
}
