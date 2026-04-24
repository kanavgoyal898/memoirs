import { NextRequest } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { urlFor } from "@/lib/sanity";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  try {
    const chromium = (await import("@sparticuz/chromium")).default as any;
    const puppeteer = await import("puppeteer-core");

    const [questions, users] = await Promise.all([
      prisma.question.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      email
        ? prisma.user.findMany({
            where: { collegeEmail: email },
            include: { response: true },
          })
        : prisma.user.findMany({
            orderBy: [{ firstName: "asc" }],
            include: { response: true },
          }),
    ]);

    const html = generateYearbookHtml(users, questions);

    const isLocal = process.env.NODE_ENV === "development";
    const executablePath = isLocal 
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : await chromium.executablePath();

    const browser = await puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="yearbook.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return apiError("PDF generation failed", 500);
  }
}

function generateYearbookHtml(
  users: Array<{
    collegeEmail: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    quote: string;
    response: { answers: unknown } | null;
  }>,
  questions: Array<{ slug: string; label: string; type: string }>
): string {
  const cards = users
    .map((user) => {
      const answers = (user.response?.answers as Record<string, unknown>) ?? {};
      const imgUrl = user.profileImage
        ? urlFor(user.profileImage).width(200).height(200).fit("crop").url()
        : "";

      const responseRows = questions
        .filter((q) => answers[q.slug] !== undefined && answers[q.slug] !== "")
        .map((q) => {
          const val = answers[q.slug];
          let display = "";
          if (Array.isArray(val)) {
            display = val.join(", ");
          } else if (typeof val === "object" && val !== null) {
            const obj = val as any;
            if (obj.countryCode && obj.number) {
              display = `${obj.countryCode} ${obj.number}`;
            } else if (q.type === "social_links") {
              display = Object.entries(obj).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ");
            } else {
              display = JSON.stringify(val);
            }
          } else {
            display = String(val);
          }
          return `<tr><td style="font-weight:700;padding:4px 8px;border-bottom:1px solid #eee">${q.label}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${display}</td></tr>`;
        })
        .join("");

      return `
      <div style="page-break-inside:avoid;border:2px solid #000;margin-bottom:24px;padding:20px;display:flex;gap:20px">
        ${imgUrl ? `<img src="${imgUrl}" style="width:120px;height:120px;object-fit:cover;border:2px solid #000;flex-shrink:0" />` : `<div style="width:120px;height:120px;background:#f0f0f0;border:2px solid #000;flex-shrink:0"></div>`}
        <div style="flex:1">
          <h2 style="margin:0 0 4px;font-size:20px;font-family:Georgia,serif">${user.firstName} ${user.lastName}</h2>
          <p style="margin:0 0 12px;font-size:12px;color:#666">${user.collegeEmail}</p>
          <blockquote style="margin:0 0 12px;font-style:italic;border-left:3px solid #000;padding-left:12px">${user.quote}</blockquote>
          ${responseRows ? `<table style="width:100%;font-size:12px;border-collapse:collapse">${responseRows}</table>` : ""}
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; }
    h1 { text-align: center; font-size: 36px; font-family: Georgia, serif; margin-bottom: 32px; border-bottom: 3px solid #000; padding-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Yearbook</h1>
  ${cards}
</body>
</html>`;
}
