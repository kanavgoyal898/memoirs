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

  function renderValue(type: string, value: unknown): React.ReactNode {
    if (value === null || value === undefined || value === "") return null;

    switch (type) {
      case "image":
        return (
          <div className="relative w-48 h-48 border-2 border-black">
            <Image
              src={urlFor(value as string).width(192).height(192).fit("crop").url()}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
          </div>
        );
      case "gallery":
        return (
          <div className="grid grid-cols-3 gap-2">
            {(value as string[]).map((img, i) => (
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
      case "social_links":
        return (
          <div className="space-y-1">
            {Object.entries(value as Record<string, string>)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="font-black w-20">{k}</span>
                  <a href={v} target="_blank" rel="noopener noreferrer" className="underline">
                    {v}
                  </a>
                </div>
              ))}
          </div>
        );
      case "key_value_list":
        return (
          <div className="space-y-1">
            {(value as { key: string; value: string }[]).map((pair, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="font-black w-32">{pair.key}</span>
                <span>{pair.value}</span>
              </div>
            ))}
          </div>
        );
      case "checkbox":
      case "multi-select":
        return (
          <div className="flex flex-wrap gap-2">
            {(value as string[]).map((v) => (
              <span key={v} className="border-2 border-black px-2 py-0.5 text-sm font-medium">
                {v}
              </span>
            ))}
          </div>
        );
      case "toggle":
        return <span className="text-sm font-bold">{value ? "Yes" : "No"}</span>;
      default:
        return <span className="text-sm">{String(value)}</span>;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="border-2 border-black shadow-[4px_4px_0px_#000] p-8 flex flex-col sm:flex-row gap-8">
        <div className="relative w-40 h-40 border-2 border-black shrink-0 bg-neutral-100">
          {imgUrl ? (
            <Image src={imgUrl} alt={`${user.firstName} ${user.lastName}`} fill className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-neutral-300">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-black">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-neutral-500 mt-1">{user.collegeEmail}</p>
          {user.quote && (
            <blockquote className="mt-4 border-l-4 border-black pl-4 italic text-neutral-700">
              &ldquo;{user.quote}&rdquo;
            </blockquote>
          )}
          {user.response?.updatedAt && (
            <p className="text-xs text-neutral-400 mt-4">
              Last updated {formatDate(user.response.updatedAt)}
            </p>
          )}
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-0 border-2 border-black shadow-[4px_4px_0px_#000] divide-y-2 divide-black">
          {questions.map((q) => {
            const val = answers[q.slug];
            const rendered = renderValue(q.type, val);
            if (!rendered) return null;
            return (
              <div key={q.id} className="p-6">
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
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
