import { NextRequest } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { urlFor } from "@/lib/sanity";
import { PDFDocument, StandardFonts, rgb, PageSizes, PDFImage } from "pdf-lib";

export const maxDuration = 30;

const NEO = {
  black:   rgb(0.04, 0.04, 0.04),
  white:   rgb(1,    1,    1),
  yellow:  rgb(1,    0.93, 0.0),
  pink:    rgb(1,    0.2,  0.5),
  cyan:    rgb(0.0,  0.9,  0.95),
  lime:    rgb(0.6,  1.0,  0.0),
  orange:  rgb(1,    0.45, 0.0),
  purple:  rgb(0.55, 0.0,  1.0),
  red:     rgb(1,    0.1,  0.1),
  dkgrey:  rgb(0.15, 0.15, 0.15),
  midgrey: rgb(0.4,  0.4,  0.4),
  ltgrey:  rgb(0.88, 0.88, 0.88),
};

const ACCENT_CYCLE = [
  NEO.yellow,
  NEO.pink,
  NEO.cyan,
  NEO.lime,
  NEO.orange,
  NEO.purple,
  NEO.red,
];

function accentFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return ACCENT_CYCLE[Math.abs(h) % ACCENT_CYCLE.length];
}

function sanitize(text: string): string {
  return String(text ?? "")
    .replace(/[^\x00-\xFF]/g, (ch) => {
      try {
        return ch
          .split("")
          .map((c) => {
            const cp = c.codePointAt(0);
            if (!cp) return "";
            if (cp <= 0xff) return c;
            const named: Record<number, string> = {
              0x1f600: ":)",  0x1f601: ":D",  0x1f602: "XD",  0x1f603: ":)",
              0x1f604: ":D",  0x1f605: "^^",  0x1f606: "lol", 0x1f607: "O:)",
              0x1f608: ">:)", 0x1f609: ";)",  0x1f60a: "^u^", 0x1f60b: ":P",
              0x1f60c: "uwu", 0x1f60d: "<3",  0x1f60e: "B)",  0x1f60f: ":>",
              0x1f610: ":|",  0x1f611: "-_-", 0x1f612: ">.<", 0x1f614: ":(",
              0x1f615: ":?",  0x1f616: ":S",  0x1f617: ":*",  0x1f618: ";*",
              0x1f619: "xD",  0x1f61a: ":*",  0x1f61b: ":P",  0x1f61c: ";P",
              0x1f61d: "XP",  0x1f61e: ":(",  0x1f61f: ":c",  0x1f620: ">:(",
              0x1f621: ">:@", 0x1f622: ":'(", 0x1f623: ">_<", 0x1f624: ">:o",
              0x1f625: ":'(", 0x1f626: "D:",  0x1f627: "D:",  0x1f628: "D:",
              0x1f629: "D:",  0x1f62a: "zzz", 0x1f62b: "x_x", 0x1f62c: ">:)",
              0x1f62d: "T_T", 0x1f631: "!!!",  0x1f632: ":O",  0x1f633: "O_O",
              0x1f634: "zzz", 0x1f635: "@_@", 0x1f636: "...", 0x1f637: ":mask:",
              0x2764:  "<3",  0x2665:  "<3",  0x2666:  "<>",  0x2763:  "<!>",
              0x2728:  "***", 0x2b50:  "*",   0x2b06:  "^",   0x2b07:  "v",
              0x2b05:  "<",   0x27a1:  ">",   0x2714:  "[x]", 0x274c:  "[X]",
              0x1f4af: "100", 0x1f525: "!!!",  0x1f44d: "[+1]",0x1f44e: "[-1]",
              0x1f389: "***", 0x1f38a: "***", 0x1f3af: ">o",  0x1f3c6: "[CUP]",
              0x1f4aa: "[!!]",0x1f91d: "[HI]",0x1f64f: "._.", 0x1f499: "<3",
              0x1f49a: "<3",  0x1f49b: "<3",  0x1f49c: "<3",  0x1f48b: "xo",
            };
            return named[cp] ?? `[U+${cp.toString(16).toUpperCase()}]`;
          })
          .join("");
      } catch {
        return "?";
      }
    })
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(text: string, maxChars: number): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (candidate.length > maxChars) {
      if (cur) lines.push(cur);
      cur = w.length > maxChars ? w.slice(0, maxChars) : w;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function displayValue(type: string, val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.countryCode && obj.number) return `${obj.countryCode} ${obj.number}`;
    if (type === "key_value_list")
      return (val as { key: string; value: string }[]).map((p) => `${p.key}: ${p.value}`).join(" | ");
    if (type === "social_links")
      return Object.entries(obj).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" | ");
    return JSON.stringify(val);
  }
  return String(val);
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedImg(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage | null> {
  try {
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes);
    return await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const emailFilter = searchParams.get("email");

  try {
    const [questions, users, wallPosts] = await Promise.all([
      prisma.question.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      emailFilter
        ? prisma.user.findMany({ where: { collegeEmail: emailFilter }, include: { response: true } })
        : prisma.user.findMany({ orderBy: [{ firstName: "asc" }], include: { response: true } }),
      prisma.wallPost.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const profileUrls = users.map((u) => {
      if (!u.profileImage) return null;
      try { return urlFor(u.profileImage as string).width(200).height(200).fit("crop").url(); }
      catch { return null; }
    });

    const wallUrls = wallPosts.map((p) => {
      try {
        if (p.imageUrl.startsWith("image-")) return urlFor(p.imageUrl).width(300).height(300).fit("crop").url();
        return p.imageUrl;
      } catch { return null; }
    });

    const [profileBytesList, wallBytesList, doc] = await Promise.all([
      Promise.all(profileUrls.map((u) => u ? fetchBytes(u) : Promise.resolve(null))),
      Promise.all(wallUrls.map((u) => u ? fetchBytes(u) : Promise.resolve(null))),
      PDFDocument.create(),
    ]);

    const [fBold, fReg, fItalic] = await Promise.all([
      doc.embedFont(StandardFonts.HelveticaBold),
      doc.embedFont(StandardFonts.Helvetica),
      doc.embedFont(StandardFonts.HelveticaOblique),
    ]);

    const [profileImages, wallImages] = await Promise.all([
      Promise.all(profileBytesList.map((b) => b ? embedImg(doc, b) : Promise.resolve(null))),
      Promise.all(wallBytesList.map((b) => b ? embedImg(doc, b) : Promise.resolve(null))),
    ]);

    const [PW, PH] = PageSizes.A4;
    const M  = 32;
    const CW = PW - M * 2;

    const cover = doc.addPage(PageSizes.A4);

    cover.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: NEO.black });

    const STRIPE_H = 6;
    const stripeColors = [NEO.yellow, NEO.pink, NEO.cyan, NEO.lime, NEO.orange, NEO.purple];
    stripeColors.forEach((c, i) => {
      cover.drawRectangle({ x: 0, y: PH - (i + 1) * STRIPE_H, width: PW, height: STRIPE_H, color: c });
    });

    const TICK = 20;
    for (let gx = 0; gx < PW; gx += TICK) {
      cover.drawLine({ start: { x: gx, y: 0 }, end: { x: gx, y: PH - stripeColors.length * STRIPE_H },
        thickness: 0.3, color: rgb(0.12, 0.12, 0.12) });
    }
    for (let gy = 0; gy < PH - stripeColors.length * STRIPE_H; gy += TICK) {
      cover.drawLine({ start: { x: 0, y: gy }, end: { x: PW, y: gy },
        thickness: 0.3, color: rgb(0.12, 0.12, 0.12) });
    }

    const BW = CW, BH = 280;
    const BX = M, BY = PH / 2 - BH / 2 - 20;

    cover.drawRectangle({ x: BX + 6, y: BY - 6, width: BW, height: BH, color: NEO.yellow });
    cover.drawRectangle({ x: BX, y: BY, width: BW, height: BH,
      color: NEO.white, borderColor: NEO.black, borderWidth: 4 });

    cover.drawRectangle({ x: BX, y: BY + BH - 72, width: BW, height: 72, color: NEO.black });
    cover.drawText("MEMOIRS", {
      x: BX + 18, y: BY + BH - 54, size: 52, font: fBold, color: NEO.yellow,
    });

    cover.drawRectangle({ x: BX, y: BY + BH - 74, width: BW, height: 4, color: NEO.yellow });

    cover.drawText("CLASS YEARBOOK", {
      x: BX + 18, y: BY + BH - 102, size: 13, font: fBold, color: NEO.black,
    });

    const tagW = 160, tagH = 28;
    cover.drawRectangle({ x: BX + 18, y: BY + BH - 140, width: tagW, height: tagH, color: NEO.pink,
      borderColor: NEO.black, borderWidth: 2 });
    cover.drawText(`${users.length} MEMBERS INSIDE`, {
      x: BX + 26, y: BY + BH - 131, size: 10, font: fBold, color: NEO.black,
    });

    const tag2W = 180;
    cover.drawRectangle({ x: BX + 18, y: BY + BH - 180, width: tag2W, height: tagH, color: NEO.cyan,
      borderColor: NEO.black, borderWidth: 2 });
    cover.drawText(`${wallPosts.length} MEMORIES CAPTURED`, {
      x: BX + 26, y: BY + BH - 171, size: 10, font: fBold, color: NEO.black,
    });

    cover.drawRectangle({ x: BX, y: BY, width: BW, height: 36, color: NEO.black });
    cover.drawText("PRINTED WITH :) AND <3", {
      x: BX + 18, y: BY + 12, size: 9, font: fItalic, color: NEO.ltgrey,
    });

    for (let i = 0; i < users.length; i++) {
      const user    = users[i];
      const answers = (user.response?.answers as Record<string, unknown>) ?? {};
      const accent  = accentFor(user.collegeEmail);
      const img     = profileImages[i];

      const page = doc.addPage(PageSizes.A4);

      page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: NEO.white });

      page.drawRectangle({ x: 0, y: PH - 112, width: PW, height: 112, color: NEO.black });

      page.drawRectangle({ x: 0, y: PH - 116, width: PW, height: 4, color: accent });

      const IDX_W = 48, IDX_H = 36;
      page.drawRectangle({ x: PW - IDX_W, y: PH - IDX_H, width: IDX_W, height: IDX_H, color: accent });
      page.drawText(`${String(i + 1).padStart(2, "0")}`, {
        x: PW - IDX_W + 6, y: PH - IDX_H + 10, size: 14, font: fBold, color: NEO.black,
      });

      const IMG = 84;
      const imgX = M;
      const imgY = PH - 112 - IMG / 2 - 4;

      page.drawRectangle({ x: imgX + 4, y: imgY - 4, width: IMG, height: IMG, color: accent });
      page.drawRectangle({ x: imgX, y: imgY, width: IMG, height: IMG,
        color: NEO.ltgrey, borderColor: NEO.black, borderWidth: 3 });

      if (img) {
        page.drawImage(img, { x: imgX, y: imgY, width: IMG, height: IMG });
        page.drawRectangle({ x: imgX, y: imgY, width: IMG, height: IMG,
          borderColor: NEO.black, borderWidth: 3, color: rgb(0,0,0,) });
        page.drawImage(img, { x: imgX, y: imgY, width: IMG, height: IMG });
      } else {
        const initials = sanitize(
          `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
        );
        page.drawRectangle({ x: imgX, y: imgY, width: IMG, height: IMG, color: NEO.dkgrey });
        page.drawText(initials, {
          x: imgX + IMG / 2 - 14, y: imgY + IMG / 2 - 10,
          size: 28, font: fBold, color: accent,
        });
      }

      const nameX = imgX + IMG + 18;
      const fullName = sanitize(`${user.firstName} ${user.lastName}`);
      page.drawText(fullName, {
        x: nameX, y: PH - 52, size: 22, font: fBold, color: NEO.white,
        maxWidth: CW - IMG - 22,
      });
      page.drawText(sanitize(user.collegeEmail), {
        x: nameX, y: PH - 74, size: 8.5, font: fReg, color: NEO.ltgrey,
      });

      page.drawRectangle({ x: nameX, y: PH - 86, width: 40, height: 14, color: accent });
      page.drawText("MEMBER", { x: nameX + 5, y: PH - 82, size: 7, font: fBold, color: NEO.black });

      let y = imgY - 20;

      if (user.quote) {
        const qLines = wrap(sanitize(`"${user.quote}"`), 78);
        const qBlockH = qLines.length * 16 + 20;

        page.drawRectangle({ x: M + 5, y: y - qBlockH + 16, width: CW - 5, height: qBlockH,
          color: NEO.black, borderColor: accent, borderWidth: 0 });
        page.drawRectangle({ x: M, y: y - qBlockH + 16, width: 5, height: qBlockH, color: accent });

        let qy = y - 4;
        for (const line of qLines) {
          if (qy < M + 30) break;
          page.drawText(line, { x: M + 14, y: qy, size: 10.5, font: fItalic, color: NEO.yellow });
          qy -= 16;
        }
        y = y - qBlockH - 16;
      }

      const answered = questions.filter((q) => {
        const v = answers[q.slug];
        return v !== undefined && v !== null && v !== "";
      });

      if (answered.length > 0) {
        page.drawRectangle({ x: M, y: y - 3, width: 80, height: 14, color: accent });
        page.drawText("PROFILE", { x: M + 5, y: y + 1, size: 7.5, font: fBold, color: NEO.black });
        y -= 20;
      }

      for (let qi = 0; qi < answered.length; qi++) {
        const q = answered[qi];
        if (y < M + 28) break;

        const valueStr = sanitize(displayValue(q.type, answers[q.slug]));
        const valLines = wrap(valueStr || "-", 84);
        const rowH = 13 + valLines.length * 13 + 10;

        const rowBg = qi % 2 === 0 ? NEO.white : rgb(0.96, 0.96, 0.96);
        page.drawRectangle({ x: M, y: y - rowH + 12, width: CW, height: rowH,
          color: rowBg, borderColor: NEO.black, borderWidth: 1 });

        page.drawRectangle({ x: M, y: y - rowH + 12, width: 5, height: rowH, color: accent });

        page.drawText(sanitize(q.label).toUpperCase(), {
          x: M + 10, y, size: 7, font: fBold, color: NEO.midgrey,
        });
        y -= 13;

        for (const line of valLines) {
          if (y < M + 28) break;
          page.drawText(line, { x: M + 10, y, size: 9.5, font: fReg, color: NEO.black });
          y -= 13;
        }
        y -= 4;
      }

      if (answered.length === 0) {
        page.drawRectangle({ x: M, y: y - 20, width: CW, height: 28, color: NEO.ltgrey,
          borderColor: NEO.black, borderWidth: 2 });
        page.drawText("NO ANSWERS YET.", { x: M + 10, y: y - 8, size: 9, font: fBold, color: NEO.midgrey });
      }

      page.drawRectangle({ x: 0, y: 0, width: PW, height: 24, color: NEO.black });
      page.drawRectangle({ x: 0, y: 22, width: PW, height: 3, color: accent });
      page.drawText(sanitize(`${user.firstName} ${user.lastName}`).toUpperCase(),
        { x: M, y: 7, size: 7.5, font: fBold, color: NEO.white });
      page.drawText(`${i + 1} / ${users.length}`,
        { x: PW - M - 28, y: 7, size: 7.5, font: fBold, color: accent });
    }

    if (wallPosts.length > 0) {
      const wallCover = doc.addPage(PageSizes.A4);

      wallCover.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: NEO.black });

      const chkSize = 28;
      const colors2 = [NEO.dkgrey, NEO.black];
      for (let cx = 0; cx < PW; cx += chkSize) {
        for (let cy = 0; cy < PH; cy += chkSize) {
          const cIdx = ((cx / chkSize) + (cy / chkSize)) % 2;
          wallCover.drawRectangle({ x: cx, y: cy, width: chkSize, height: chkSize, color: colors2[cIdx] });
        }
      }

      const wcW = CW, wcH = 160;
      const wcX = M, wcY = PH / 2 - wcH / 2;

      wallCover.drawRectangle({ x: wcX + 7, y: wcY - 7, width: wcW, height: wcH, color: NEO.pink });
      wallCover.drawRectangle({ x: wcX, y: wcY, width: wcW, height: wcH,
        color: NEO.black, borderColor: NEO.white, borderWidth: 4 });

      wallCover.drawText("MEMORY", {
        x: wcX + 20, y: wcY + wcH - 58, size: 46, font: fBold, color: NEO.white,
      });
      wallCover.drawText("WALL", {
        x: wcX + 20, y: wcY + wcH - 104, size: 72, font: fBold, color: NEO.pink,
      });
      wallCover.drawRectangle({ x: wcX, y: wcY + wcH - 108, width: wcW, height: 5, color: NEO.white });
      wallCover.drawRectangle({ x: wcX, y: wcY, width: wcW, height: 30, color: NEO.white });
      wallCover.drawText(`${wallPosts.length} PHOTOS // ALL THE FEELS`, {
        x: wcX + 14, y: wcY + 9, size: 10, font: fBold, color: NEO.black,
      });

      const COLS = 3;
      const GAP  = 4;
      const PAGE_H_USABLE = PH - 40;
      const cellW = Math.floor((PW - GAP * (COLS + 1)) / COLS);

      const ROWS_PER_PAGE = 4;
      const cellH = Math.floor((PAGE_H_USABLE - GAP * (ROWS_PER_PAGE + 1)) / ROWS_PER_PAGE);

      const postsPerPage = COLS * ROWS_PER_PAGE;

      const mosaicAccents = [NEO.yellow, NEO.pink, NEO.cyan, NEO.lime, NEO.orange, NEO.purple, NEO.red];

      for (let pi = 0; pi < wallPosts.length; pi += postsPerPage) {
        const page = doc.addPage(PageSizes.A4);

        page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: NEO.black });

        page.drawRectangle({ x: 0, y: PH - 26, width: PW, height: 26, color: NEO.yellow });
        page.drawText("MEMORY WALL", { x: M, y: PH - 18, size: 10, font: fBold, color: NEO.black });
        const pg = Math.floor(pi / postsPerPage) + 1;
        const totalPg = Math.ceil(wallPosts.length / postsPerPage);
        page.drawText(`PG ${pg}/${totalPg}`, {
          x: PW - M - 40, y: PH - 18, size: 9, font: fBold, color: NEO.black,
        });

        for (let slot = 0; slot < postsPerPage; slot++) {
          const idx = pi + slot;
          if (idx >= wallPosts.length) break;
          const img = wallImages[idx];

          const col = slot % COLS;
          const row = Math.floor(slot / COLS);

          const cellX = GAP + col * (cellW + GAP);
          const cellY = PH - 26 - GAP - (row + 1) * (cellH + GAP) + GAP;

          const borderAccent = mosaicAccents[idx % mosaicAccents.length];

          page.drawRectangle({ x: cellX + 3, y: cellY - 3, width: cellW, height: cellH, color: borderAccent });
          page.drawRectangle({ x: cellX, y: cellY, width: cellW, height: cellH, color: NEO.dkgrey,
            borderColor: NEO.white, borderWidth: 2 });

          if (img) {
            page.drawImage(img, { x: cellX, y: cellY, width: cellW, height: cellH });
            page.drawRectangle({ x: cellX, y: cellY, width: cellW, height: cellH,
              borderColor: NEO.white, borderWidth: 2 });
          } else {
            const ph = ["[?]", "[IMG]", "...", "[404]", "[NO PIC]"][idx % 5];
            page.drawText(ph, {
              x: cellX + cellW / 2 - 12, y: cellY + cellH / 2 - 6,
              size: 9, font: fBold, color: NEO.midgrey,
            });
          }
        }
      }
    }

    const pdfBytes = await doc.save();

    const buffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );

    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="yearbook.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("[PDF export error]", msg, stack);
    return apiError(`PDF generation failed: ${msg}`, 500);
  }
}
