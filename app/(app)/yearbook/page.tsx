"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileCard } from "@/components/profile-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useDebounce } from "@/lib/hooks";

interface User {
  collegeEmail: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  quote: string;
}

interface ApiResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export default function YearbookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "alphabetical");
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search: debouncedSearch, sort, limit: "24" });
    const res = await fetch(`/api/yearbook?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [debouncedSearch, sort]);

  useEffect(() => { fetch_(); }, [fetch_]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort !== "alphabetical") params.set("sort", sort);
    router.replace(`/yearbook?${params}`, { scroll: false });
  }, [search, sort, router]);

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-black pb-6 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-black">Yearbook</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {data?.total ?? 0} classmates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={sort === "alphabetical" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("alphabetical")}
          >
            A–Z
          </Button>
          <Button
            variant={sort === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("recent")}
          >
            Recent
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          id="yearbook-search"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-2 border-black shadow-[4px_4px_0px_#000] animate-pulse">
              <div className="aspect-square bg-neutral-100 border-b-2 border-black" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-200 w-3/4" />
                <div className="h-3 bg-neutral-100 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.users.length === 0 ? (
        <div className="border-2 border-black p-16 text-center">
          <p className="font-black text-xl">No results</p>
          <p className="text-sm text-neutral-500 mt-1">Try a different search term.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.users.map((user, i) => (
              <ProfileCard key={user.collegeEmail} {...user} index={i} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
