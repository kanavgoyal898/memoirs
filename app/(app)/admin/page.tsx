import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, HelpCircle, Upload } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin" };

const sections = [
  {
    icon: Users,
    title: "Manage Users",
    description: "Create users, reset passwords, assign roles, and view account status.",
    href: "/admin/users",
  },
  {
    icon: Upload,
    title: "Bulk Import",
    description: "Upload a CSV to create or update multiple users at once.",
    href: "/admin/import",
  },
  {
    icon: HelpCircle,
    title: "Questions",
    description: "Create and manage dynamic yearbook profile questions.",
    href: "/admin/questions",
  },
];

export default async function AdminPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-10">
      <div className="border-b-2 border-black pb-6">
        <h1 className="text-3xl font-black">Admin Panel</h1>
        <p className="text-sm text-neutral-500 mt-1">System administration and configuration.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {sections.map(({ icon: Icon, title, description, href }) => (
          <Link
            key={href}
            href={href}
            className="border-2 border-black p-6 shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block"
          >
            <Icon className="h-6 w-6 mb-4" />
            <h2 className="font-black text-lg">{title}</h2>
            <p className="text-sm text-neutral-600 mt-1">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
