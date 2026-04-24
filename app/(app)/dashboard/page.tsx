import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeProfileCompletion } from "@/lib/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCountdown } from "@/components/graduation-countdown";
import Link from "next/link";
import { BookOpen, ImageIcon, LayoutGrid, User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const email = session!.user.email;

  const [completion, wallCount, yearbookCount] = await Promise.all([
    computeProfileCompletion(email),
    prisma.wallPost.count(),
    prisma.user.count(),
  ]);

  const user = await prisma.user.findUnique({
    where: { collegeEmail: email },
    select: { firstName: true, lastName: true, quote: true },
  });

  const cards = [
    {
      icon: User,
      title: "My Profile",
      description: "Fill out your yearbook profile and upload your photo.",
      href: "/form",
      stat: `${completion}% complete`,
      warn: completion < 100,
      color: "bg-pastel-pink",
    },
    {
      icon: BookOpen,
      title: "Yearbook",
      description: "Browse the full graduating class directory.",
      href: "/yearbook",
      stat: `${yearbookCount} members`,
      warn: false,
      color: "bg-pastel-purple",
    },
    {
      icon: ImageIcon,
      title: "Memory Wall",
      description: "Share photos and memories with your classmates.",
      href: "/wall",
      stat: `${wallCount} posts`,
      warn: false,
      color: "bg-pastel-green",
    },
    {
      icon: LayoutGrid,
      title: "Export PDF",
      description: "Download the complete yearbook as a PDF.",
      href: "/api/export/pdf",
      stat: "Full yearbook",
      warn: false,
      color: "bg-pastel-orange",
    },
  ];

  const graduationDate = process.env.NEXT_PUBLIC_GRADUATION_DATE ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black tracking-tight">
        Welcome back, {user?.firstName}.
      </h1>

      {
        completion < 100 && (
          <div className="border-2 border-black bg-black text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-black">Profile {completion}% complete</p>
              <p className="text-sm text-neutral-300 mt-0.5">
                Complete your profile so classmates can find you in the yearbook.
              </p>
            </div>
            <Link href="/form">
              <Button variant="outline" className="bg-white text-black border-white hover:bg-black hover:text-white">
                Complete now
              </Button>
            </Link>
          </div>
        )
      }

      {
        graduationDate && (
          <GraduationCountdown targetDate={graduationDate} />
        )
      }

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ icon: Icon, title, description, href, stat, warn, color }) => (
          <Card key={title} className={`${color} ${warn ? "border-black" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                <span className={`text-xs font-black px-2 py-0.5 border-2 border-black ${warn ? "bg-black text-white" : ""}`}>
                  {stat}
                </span>
              </div>
              <CardTitle className="mt-4">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-4">{description}</p>
              <Link href={href}>
                <Button variant="outline" size="sm" className="w-full">
                  {title === "Export PDF" ? "Download" : "Go"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div >
  );
}
