"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
}

const USER_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/form", label: "My Profile" },
  { href: "/yearbook", label: "Yearbook" },
  { href: "/wall", label: "Memory Wall" },
];

const ADMIN_LINKS: NavLink[] = [
  ...USER_LINKS,
  { href: "/admin", label: "Admin Panel" },
];

interface NavbarProps {
  role: string;
  email: string;
  name: string;
}

export function Navbar({ role, email }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = role === "ADMIN" ? ADMIN_LINKS : USER_LINKS;

  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-black text-lg tracking-tight truncate pr-4">
          MEMOIRS
        </Link>

        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-medium text-neutral-500 truncate max-w-[160px]">
            {email.split("@")[0]}
          </span>
          {role === "ADMIN" && (
            <Link href="/admin">
              <Button size="sm" variant="ghost">
                Admin Panel
              </Button>
            </Link>
          )}
          <Link href="/change-password">
            <Button size="sm" variant="ghost">
              Change Password
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>

        <button 
          className="sm:hidden p-2 -mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden border-t-2 border-black bg-white px-4 py-4 flex flex-col gap-2 shadow-[0_4px_0px_#000]">
          <p className="text-xs font-medium text-neutral-500 mb-2 truncate px-4">{email}</p>
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                {link.label}
              </Button>
            </Link>
          ))}
          <div className="h-px bg-neutral-200 my-2" />
          <Link href="/change-password" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Change Password
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      )}
    </header>
  );
}
