"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/providers/toast-provider";
import { formatDate } from "@/lib/utils";
import { Search, RotateCcw, Plus, Lock } from "lucide-react";
import { generateTempPassword } from "@/lib/hash";
import Link from "next/link";

interface User {
  collegeEmail: string;
  firstName: string;
  lastName: string;
  role: string;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockUntil: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    collegeEmail: "",
    firstName: "",
    lastName: "",
    quote: "",
    password: "",
    role: "USER",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, limit: "50" });
    const res = await fetch(`/api/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function updateForm(field: string, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "User created" });
      setCreateOpen(false);
      setForm({ collegeEmail: "", firstName: "", lastName: "", quote: "", password: "", role: "USER" });
      load();
    } catch (err) {
      toast({ title: "Failed to create user", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleReset() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetTarget.collegeEmail, newPassword: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Password reset. User must change on next login." });
      setResetTarget(null);
      setResetPassword("");
      load();
    } catch (err) {
      toast({ title: "Failed to reset", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  }

  const isLocked = (user: User) =>
    user.lockUntil && new Date(user.lockUntil) > new Date();

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-black pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black">Users</h1>
          <p className="text-sm text-neutral-500 mt-1">{total} registered users</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import">
            <Button variant="outline" size="sm">Bulk import</Button>
          </Link>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New user
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-2 border-black p-4 animate-pulse">
              <div className="h-4 bg-neutral-200 w-1/3 mb-2" />
              <div className="h-3 bg-neutral-100 w-1/4" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="border-2 border-black p-16 text-center">
          <p className="font-black text-xl">No users found</p>
          <p className="text-sm text-neutral-500 mt-1">Create a user or adjust your search.</p>
        </div>
      ) : (
        <div className="border-2 border-black divide-y-2 divide-black">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2"></div>
          </div>
          {users.map((user, i) => (
            <motion.div
              key={user.collegeEmail}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-12 gap-2 px-4 py-4 items-center hover:bg-neutral-50"
            >
              <div className="col-span-4">
                <p className="font-black text-sm">{user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : "—"}</p>
                <p className="text-xs text-neutral-500 truncate">{user.collegeEmail}</p>
              </div>
              <div className="col-span-2">
                <span className={`text-xs font-black px-1.5 py-0.5 ${user.role === "ADMIN" ? "bg-black text-white" : "bg-neutral-100"}`}>
                  {user.role}
                </span>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                {user.mustChangePassword && (
                  <span className="text-xs font-bold text-amber-700 px-1 uppercase tracking-tight">Force Reset</span>
                )}
                {isLocked(user) && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-700 px-1">
                    <Lock className="h-3 w-3" /> LOCKED
                  </span>
                )}
                {!user.mustChangePassword && !isLocked(user) && (
                  <span className="text-xs text-neutral-400">Active</span>
                )}
              </div>
              <div className="col-span-2 text-xs text-neutral-500">
                {formatDate(user.createdAt)}
              </div>
              <div className="col-span-2 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setResetTarget(user);
                    setResetPassword(generateTempPassword());
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cu-first">First name</Label>
                <Input id="cu-first" value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-last">Last name</Label>
                <Input id="cu-last" value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-email">College email</Label>
              <Input id="cu-email" type="email" value={form.collegeEmail} onChange={(e) => updateForm("collegeEmail", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-quote">Quote</Label>
              <Input id="cu-quote" value={form.quote} onChange={(e) => updateForm("quote", e.target.value)} placeholder="Optional initial quote" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-pw">Temporary password</Label>
              <Input id="cu-pw" type="text" value={form.password} onChange={(e) => updateForm("password", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => updateForm("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setResetPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Reset password for <strong>{resetTarget?.collegeEmail}</strong>. They will be required to change it on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="text"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setResetTarget(null); setResetPassword(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting || !resetPassword}>
              {resetting ? "Resetting..." : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
