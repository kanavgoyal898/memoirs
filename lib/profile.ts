import { prisma } from "@/lib/prisma";

export async function computeProfileCompletion(email: string): Promise<number> {
  const [questions, response] = await Promise.all([
    prisma.question.findMany({
      where: { isActive: true, required: true },
      select: { slug: true },
      orderBy: { order: "asc" },
    }),
    prisma.response.findUnique({
      where: { collegeEmail: email },
      select: { answers: true },
    }),
  ]);

  if (questions.length === 0) return 100;

  const answers = (response?.answers as Record<string, unknown>) ?? {};
  const answered = questions.filter((q) => {
    const val = answers[q.slug];
    if (val === null || val === undefined) return false;
    if (typeof val === "string" && val.trim() === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === "object" && val !== null && (val as any).number === "") return false;
    return true;
  });

  return Math.round((answered.length / questions.length) * 100);
}

export async function getUserProfileSummary(email: string) {
  const user = await prisma.user.findUnique({
    where: { collegeEmail: email },
    select: {
      collegeEmail: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      quote: true,
      response: { select: { answers: true, updatedAt: true } },
    },
  });

  return user;
}
