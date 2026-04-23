import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { Navbar } from "@/components/navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");

  return (
    <NextAuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar
          role={session.user.role}
          email={session.user.email}
          name={session.user.name ?? ""}
        />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
          {children}
        </main>
      </div>
    </NextAuthProvider>
  );
}
