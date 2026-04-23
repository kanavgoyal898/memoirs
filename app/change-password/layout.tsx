import { NextAuthProvider } from "@/components/providers/session-provider";

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return <NextAuthProvider>{children}</NextAuthProvider>;
}
