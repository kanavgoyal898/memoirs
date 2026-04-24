"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { WallPostCard } from "@/components/wall-post-card";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface WallPost {
  id: string;
  imageUrl: string;
  caption: string;
  uploadedBy: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

export default function WallPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/wall?limit=50");
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  async function handlePost() {
    if (!pendingImage || !caption.trim()) {
      toast({ title: "Image and caption are required", variant: "destructive" });
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: pendingImage, caption }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts((prev) => [data, ...prev]);
      setPendingImage(null);
      setCaption("");
      setOpen(false);
      toast({ title: "Post shared" });
    } catch (err) {
      toast({
        title: "Failed to post",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  const email = session?.user?.email ?? "";
  const role = session?.user?.role ?? "";

  return (
    <div className="space-y-10">
      <div className="border-b-2 border-black pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Memory Wall</h1>
          <p className="text-sm text-neutral-500 mt-1">Share photos and memories with your batchmates.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 gap-2 text-md">
              <Plus className="h-5 w-5" /> Share a memory
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-pastel-yellow sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl uppercase">Share a memory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {pendingImage ? (
                <div className="flex items-center gap-3 border-2 border-black p-3 bg-white">
                  <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 uppercase">Ready</span>
                  <span className="text-xs text-neutral-500 flex-1 truncate">{pendingImage}</span>
                  <button
                    className="text-xs underline font-bold"
                    onClick={() => setPendingImage(null)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <FileUpload
                  onUpload={(id) => setPendingImage(id)}
                  label="Upload photo"
                  type="image"
                />
              )}
              <div className="space-y-2">
                <Label htmlFor="caption" className="font-black uppercase text-xs">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write something about this photo..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="min-h-[100px] border-2 border-black focus-visible:ring-0"
                />
              </div>
              <Button
                onClick={handlePost}
                disabled={posting || !pendingImage}
                className="w-full h-12 text-lg"
              >
                {posting ? "Sharing..." : "Post Memory"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-2 border-black shadow-[4px_4px_0px_#000] animate-pulse">
              <div className="aspect-square bg-neutral-100 border-b-2 border-black" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-neutral-200 w-3/4" />
                <div className="h-3 bg-neutral-100 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="border-2 border-black p-16 text-center">
          <p className="font-black text-xl">No posts yet</p>
          <p className="text-sm text-neutral-500 mt-1">Be the first to share a memory.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <WallPostCard
                key={post.id}
                id={post.id}
                imageUrl={post.imageUrl}
                caption={post.caption}
                uploadedBy={post.uploadedBy}
                uploaderName={`${post.user.firstName} ${post.user.lastName}`}
                createdAt={post.createdAt}
                canDelete={post.uploadedBy === email || role === "ADMIN"}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
