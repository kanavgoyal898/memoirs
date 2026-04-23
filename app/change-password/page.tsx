"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";

import { useSession } from "next-auth/react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mustChange = session?.user?.mustChangePassword ?? true;

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({ title: "Password changed. Please sign in again." });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight">
            {mustChange ? "Set your password" : "Change password"}
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            {mustChange 
              ? "You must change your password before continuing." 
              : "Update your account password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
            <Input
              id="current"
              type="password"
              value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <Input
              id="new"
              type="password"
              value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              required
            />
            <p className="text-xs text-neutral-500">Min 8 characters, 1 uppercase, 1 number.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="border-2 border-black bg-black text-white px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : (mustChange ? "Set password" : "Change password")}
            </Button>
            {!mustChange && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full mt-2" 
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
