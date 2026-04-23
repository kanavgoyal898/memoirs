import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req: NextRequest & { auth: { user?: { mustChangePassword?: boolean; role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";

  if (isRoot) {
    return NextResponse.redirect(new URL(session?.user ? "/dashboard" : "/login", req.url));
  }

  if (!session?.user && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session?.user?.mustChangePassword && pathname !== "/change-password" && !isPublic) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  if (pathname.startsWith("/admin") && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
