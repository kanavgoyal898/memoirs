import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import { urlFor } from "@/lib/sanity";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ email: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { email } = await params;
  const user = await prisma.user.findUnique({
    where: { collegeEmail: decodeURIComponent(email).toLowerCase() },
    select: { firstName: true, lastName: true },
  });
  if (!user) return { title: "Not found" };
  return { title: `${user.firstName} ${user.lastName}` };
}

export default async function ProfilePage({ params }: Props) {
  await auth();
  const { email } = await params;
  const decoded = decodeURIComponent(email).toLowerCase();

  const user = await prisma.user.findUnique({
    where: { collegeEmail: decoded },
    include: { response: true },
  });

  if (!user) notFound();

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const answers = (user.response?.answers as Record<string, unknown>) ?? {};

  const imgUrl = user.profileImage
    ? urlFor(user.profileImage).width(480).height(480).fit("crop").url()
    : null;

  function renderValue(type: string, value: unknown, options: string[] = []): React.ReactNode {
    if (value === null || value === undefined || value === "") return null;

    switch (type) {
      // ── Plain text ───────────────────────────────────────────────────────
      case "text":
      case "textarea":
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{String(value)}</p>;

      // ── Single choice — all options shown, selected filled black ────────
      case "select":
      case "radio": {
        const selected = String(value);
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <span
                key={opt}
                className={`text-sm font-bold px-4 py-1.5 border-2 transition-none
                  ${opt === selected
                    ? "bg-black text-white border-black shadow-[2px_2px_0px_#000]"
                    : "bg-white"
                  }`}
              >
                {opt}
              </span>
            ))}
          </div>
        );
      }

      case "number":
        return <p className="text-sm font-medium">{String(value)}</p>;

      // ── Date — format from ISO to readable ──────────────────────────────
      case "date": {
        const formatted = (() => {
          try {
            return new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(value as string));
          } catch {
            return String(value);
          }
        })();
        return <p className="text-sm font-medium">{formatted}</p>;
      }

      // ── Active links ─────────────────────────────────────────────────────
      case "email":
        return (
          <a
            href={`mailto:${value as string}`}
            className="text-sm font-black underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity break-all"
          >
            {value as string}
          </a>
        );

      case "url":
        return (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-black underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity break-all"
          >
            {value as string}
          </a>
        );

      // ── Toggle ───────────────────────────────────────────────────────────
      case "toggle":
        return (
          <span
            className={`inline-block text-xs font-black px-3 py-1 border-2 border-black ${
              value ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {value ? "Yes" : "No"}
          </span>
        );

      // ── Phone ────────────────────────────────────────────────────────────
      case "phone": {
        if (typeof value === "string") return <p className="text-sm font-medium">{value}</p>;
        const phone = value as { countryCode: string; number: string };
        if (!phone.number) return null;
        return (
          <p className="text-sm font-medium">
            {phone.countryCode} {phone.number}
          </p>
        );
      }

      // ── Multiple choice — all options shown, selected ones filled black ──
      case "checkbox":
      case "multi-select": {
        const selected = value as string[];
        if (!selected.length) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <span
                key={opt}
                className={`text-sm font-bold px-4 py-1.5 border-2 transition-none
                  ${selected.includes(opt)
                    ? "bg-black text-white border-black shadow-[2px_2px_0px_#000]"
                    : "bg-white"
                  }`}
              >
                {opt}
              </span>
            ))}
          </div>
        );
      }

      // ── Media ────────────────────────────────────────────────────────────
      case "image":
        return (
          <div className="relative w-48 h-48 border-2 border-black shadow-[4px_4px_0px_#000]">
            <Image
              src={urlFor(value as string).width(192).height(192).fit("crop").url()}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
          </div>
        );

      case "gallery": {
        const imgs = value as string[];
        if (!imgs.length) return null;
        return (
          <div className="grid grid-cols-3 gap-2">
            {imgs.map((img, i) => (
              <div key={i} className="relative aspect-square border-2 border-black">
                <Image
                  src={urlFor(img).width(200).height(200).fit("crop").url()}
                  alt={`Gallery ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        );
      }

      case "file":
        return (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-black px-4 py-2 text-sm font-black bg-white shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            View file ↗
          </a>
        );

      // ── Structured ───────────────────────────────────────────────────────
      case "social_links": {
        const entries = Object.entries(value as Record<string, string>).filter(([, v]) => v);
        if (!entries.length) return null;
        return (
          <div className="space-y-2">
            {entries.map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-3 text-sm">
                <span className="font-black uppercase tracking-wider text-xs w-24 shrink-0">
                  {k}
                </span>
                <a
                  href={v}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity break-all"
                >
                  {v}
                </a>
              </div>
            ))}
          </div>
        );
      }

      case "key_value_list": {
        const pairs = value as { key: string; value: string }[];
        if (!pairs.length) return null;
        return (
          <div className="flex flex-wrap gap-2">
            {pairs.map((pair, i) => (
              <div
                key={i}
                className="flex items-stretch border-2 border-black text-sm font-medium overflow-hidden shadow-[2px_2px_0px_#000]"
              >
                <span className="bg-black text-white px-3 py-1 font-black">
                  {pair.key}
                </span>
                <span className="bg-white text-black px-3 py-1">
                  {pair.value}
                </span>
              </div>
            ))}
          </div>
        );
      }

      default:
        return <p className="text-sm">{String(value)}</p>;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Header card */}
      <div className="border-2 border-black shadow-[4px_4px_0px_#000] p-8 flex flex-col sm:flex-row gap-8">
        <div className="relative w-40 h-40 border-2 border-black shrink-0">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={`${user.firstName} ${user.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-4xl font-black">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-black">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-neutral-500 mt-1">{user.collegeEmail}</p>
          {user.quote && (
            <blockquote className="mt-4 border-l-4 border-black pl-2">
              {user.quote}
            </blockquote>
          )}
          {user.response?.updatedAt && (
            <p className="text-xs text-neutral-400 mt-4">
              Last updated {formatDate(user.response.updatedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Answers */}
      {questions.length > 0 && (
        <div className="border-2 border-black shadow-[4px_4px_0px_#000] divide-y-2 divide-black">
          {questions.map((q) => {
            const val = answers[q.slug];
            const rendered = renderValue(q.type, val, (q.options as string[]) ?? []);
            if (!rendered) return null;
            return (
              <div key={q.id} className="p-6">
                <p className="text-xs font-black uppercase tracking-widest mb-3">
                  {q.label}
                </p>
                {rendered}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
