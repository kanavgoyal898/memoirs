import React from "react";
import { NextRequest } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { urlFor } from "@/lib/sanity";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  renderToStream,
} from "@react-pdf/renderer";

import fs from "fs";
import path from "path";

export const maxDuration = 30;

// Helper to get local font path
const fontPath = (filename: string) => path.join(process.cwd(), "public/fonts", filename);

// Register fonts for foreign languages and emojis
Font.register({
  family: "Inter",
  fonts: [
    { src: fontPath("Inter-Regular.ttf") },
    { src: fontPath("Inter-Bold.ttf"), fontWeight: "bold" },
    { src: fontPath("Inter-Italic.ttf"), fontStyle: "italic" },
  ],
});

Font.register({
  family: "NotoSans",
  src: fontPath("NotoSans-Regular.ttf"),
});

Font.register({
  family: "NotoEmoji",
  src: fontPath("NotoEmoji-Regular.ttf"),
});

Font.registerEmojiSource({
  format: "png",
  url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
});

const PASTELS = ["#fbcfe8", "#bfdbfe", "#bbf7d0", "#fef08a", "#e9d5ff", "#fed7aa"];

function getAccent(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return PASTELS[h % PASTELS.length];
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Inter",
    padding: 30,
    color: "#000000",
  },
  coverPage: {
    backgroundColor: "#fef08a",
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  coverBox: {
    border: "4pt solid #000",
    backgroundColor: "#fff",
    padding: 40,
    width: "100%",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 48,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  sectionHeader: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "10 15",
    marginBottom: 30,
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCell: {
    width: "30%",
    marginBottom: 20,
    border: "2pt solid #000",
  },
  gridImageContainer: {
    height: 120,
    borderBottom: "2pt solid #000",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  gridInitials: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ccc",
  },
  gridContent: {
    padding: 10,
  },
  gridName: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  gridEmail: {
    fontSize: 9,
    color: "#555",
    marginBottom: 8,
  },
  gridQuote: {
    fontSize: 9,
    fontStyle: "italic",
    borderLeft: "2pt solid #000",
    paddingLeft: 5,
    color: "#333",
  },
  // Dedicated Page
  dedicatedPage: {
    padding: 30,
    fontFamily: "Inter",
    backgroundColor: "#ffffff",
  },
  cardContainer: {
    position: "relative",
    width: "100%",
    minHeight: "100%",
  },
  cardShadow: {
    position: "absolute",
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: "#000",
  },
  profileCard: {
    minHeight: "100%",
    position: "relative",
    flexDirection: "row",
  },
  cardHeader: {
    display: "none",
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 10,
    lineHeight: 1.1,
  },
  headerEmail: {
    display: "none",
  },
  cardBody: {
    flexDirection: "row",
    padding: 25,
    flex: 1,
  },
  profileLeft: {
    width: 350,
    flexShrink: 0,
    gap: 20,
  },
  profileImageContainer: {
    width: 350,
    height: 350,
    border: "2.5pt solid #000",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  profileInitials: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#000",
    opacity: 0.1,
  },
  headerQuote: {
    display: "none",
  },
  profileRight: {
    flex: 1,
    paddingLeft: 30,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 12,
    borderBottom: "2pt solid #000",
    paddingBottom: 4,
    alignSelf: "flex-start",
  },
  answersContainer: {
    gap: 12,
  },
  answerBox: {
    border: "1.5pt solid #000",
    padding: 10,
    backgroundColor: "#fff",
  },
  answerLabel: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
    color: "#000",
  },
  answerValue: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#000",
  },
  capsuleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  capsule: {
    border: "1.5pt solid #000",
    borderRadius: 12,
    padding: "3 10",
    backgroundColor: "#fff",
  },
  capsuleText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000",
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  pill: {
    border: "2pt solid #000",
    backgroundColor: "#fff",
    padding: "4 8",
  },
  pillSelected: {
    backgroundColor: "#000",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  pillTextSelected: {
    color: "#fff",
  },
  fieldImage: {
    width: 120,
    height: 120,
    border: "1.5pt solid #000",
    objectFit: "cover",
    marginTop: 6,
  },
  galleryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  galleryImage: {
    width: 60,
    height: 60,
    border: "2pt solid #000",
    objectFit: "cover",
  },
  wallImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
});

const RenderField = ({ type, value, options }: { type: string, value: unknown, options?: string[] }) => {
  if (value === null || value === undefined || value === "") return null;

  switch (type) {
    case "text":
    case "textarea":
      return <Text style={styles.answerValue}>{String(value)}</Text>;
    case "select":
    case "radio": {
      const selected = String(value);
      return (
        <View style={styles.pillContainer}>
          {(options || []).map(opt => (
            <View key={opt} style={[styles.pill, opt === selected ? styles.pillSelected : {}]}>
              <Text style={[styles.pillText, opt === selected ? styles.pillTextSelected : {}]}>{opt}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "checkbox":
    case "multi-select": {
      const selected = value as string[];
      if (!selected.length) return null;
      return (
        <View style={styles.pillContainer}>
          {(options || []).map(opt => (
            <View key={opt} style={[styles.pill, selected.includes(opt) ? styles.pillSelected : {}]}>
              <Text style={[styles.pillText, selected.includes(opt) ? styles.pillTextSelected : {}]}>{opt}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "image":
      return (
        <Image src={urlFor(value as string).width(200).height(200).fit("crop").url()} style={styles.fieldImage} />
      );
    case "gallery": {
      const imgs = value as string[];
      if (!imgs.length) return null;
      return (
        <View style={styles.galleryContainer}>
          {imgs.map((img, i) => (
             <Image key={i} src={urlFor(img).width(150).height(150).fit("crop").url()} style={styles.galleryImage} />
          ))}
        </View>
      );
    }
    case "social_links": {
      const entries = Object.entries(value as Record<string, string>).filter(([, v]) => v);
      if (!entries.length) return null;
      return (
        <View style={styles.capsuleContainer}>
          {entries.map(([k, v]) => (
             <View key={k} style={styles.capsule}>
               <Text style={styles.capsuleText}>{k.toUpperCase()}: {v}</Text>
             </View>
          ))}
        </View>
      );
    }
    case "key_value_list": {
      const pairs = value as { key: string; value: string }[];
      if (!pairs.length) return null;
      return (
        <View style={styles.capsuleContainer}>
          {pairs.map((p, i) => (
             <View key={i} style={styles.capsule}>
               <Text style={styles.capsuleText}>{p.key}: {p.value}</Text>
             </View>
          ))}
        </View>
      );
    }
    case "phone": {
      if (typeof value === "string") return <Text style={styles.answerValue}>{value}</Text>;
      const phone = value as { countryCode: string; number: string };
      if (!phone.number) return null;
      return <Text style={styles.answerValue}>{phone.countryCode} {phone.number}</Text>;
    }
    case "date": {
      try {
        const formatted = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value as string));
        return <Text style={styles.answerValue}>{formatted}</Text>;
      } catch {
        return <Text style={styles.answerValue}>{String(value)}</Text>;
      }
    }
    case "email":
    case "url":
      return <Text style={[styles.answerValue, { color: "#000", fontWeight: "bold" }]}>{String(value)}</Text>;
    default: {
      if (typeof value === "boolean") {
        const label = value ? "YES" : "NO";
        return (
          <View style={[styles.pill, { backgroundColor: "#000", marginTop: 4, paddingHorizontal: 15 }]}>
            <Text style={[styles.pillText, { color: "#fff" }]}>{label}</Text>
          </View>
        );
      }
      return <Text style={styles.answerValue}>{String(value)}</Text>;
    }
  }
};

// React Components for PDF Layout
const YearbookDocument = ({ users, questions }: any) => {
  
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverBox}>
          <Text style={styles.coverTitle}>YEARBOOK</Text>
        </View>
      </Page>

      {/* Section 2: Dedicated Pages */}
      {users.map((user: any) => {
        const answers = (user.response?.answers as Record<string, unknown>) ?? {};
        const answered = questions.filter((q: any) => {
          const v = answers[q.slug];
          return v !== undefined && v !== null && v !== "";
        });
        const imgUrl = user.profileImage ? urlFor(user.profileImage).width(600).height(600).fit("crop").url() : null;
        const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

        return (
          <Page key={`user-${user.collegeEmail}`} size="A4" orientation="landscape" style={styles.dedicatedPage}>
            <View style={styles.profileCard}>
              <View style={styles.profileLeft}>
                <View style={styles.profileImageContainer}>
                  {imgUrl ? (
                    <Image src={imgUrl} style={styles.profileImage} />
                  ) : (
                    <Text style={styles.profileInitials}>{initials}</Text>
                  )}
                </View>
                <Text style={styles.headerName}>{user.firstName} {user.lastName}</Text>
              </View>

              <View style={styles.profileRight}>
                {answered.length > 0 && (
                  <View style={styles.answersContainer}>
                    <Text style={styles.sectionTitle}>Responses & Memories</Text>
                    {answered.map((q: any, idx: number) => {
                      const isMedia = q.type === "image" || q.type === "gallery";
                      const bgColor = isMedia ? "#ffffff" : PASTELS[(idx + 1) % PASTELS.length];
                      return (
                        <View key={q.slug} style={[styles.answerBox, { backgroundColor: bgColor }]} wrap={false}>
                          <Text style={styles.answerLabel}>{q.label}</Text>
                          <RenderField type={q.type} value={answers[q.slug]} options={q.options} />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const emailFilter = searchParams.get("email");

  try {
    const [questions, users] = await Promise.all([
      prisma.question.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      emailFilter
        ? prisma.user.findMany({ where: { collegeEmail: emailFilter }, include: { response: true } })
        : prisma.user.findMany({ orderBy: [{ firstName: "asc" }], include: { response: true } }),
    ]);

    const stream = await renderToStream(
      <YearbookDocument users={users} questions={questions} />
    );

    return new Response(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="yearbook.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PDF export error]", err);
    return apiError(`PDF generation failed: ${msg}`, 500);
  }
}
