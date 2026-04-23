"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { urlFor } from "@/lib/sanity";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

interface WallPostCardProps {
  id: string;
  imageUrl: string;
  caption: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

const PASTEL_COLORS = [
  "bg-pastel-pink",
  "bg-pastel-blue",
  "bg-pastel-green",
  "bg-pastel-yellow",
  "bg-pastel-purple",
  "bg-pastel-orange"
];

export function WallPostCard({
  id,
  imageUrl,
  caption,
  uploadedBy,
  uploaderName,
  createdAt,
  canDelete,
  onDelete,
}: WallPostCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const imgUrl = imageUrl.startsWith("image-")
    ? urlFor(imageUrl).width(600).url()
    : imageUrl;

  const colorIndex = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % PASTEL_COLORS.length;
  const bgColor = PASTEL_COLORS[colorIndex];

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/wall/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(id);
      toast({ title: "Post deleted" });
    } catch {
      toast({ title: "Failed to delete post", variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`border-2 border-black ${bgColor} shadow-[4px_4px_0px_#000]`}
      >
        <div className="aspect-square relative overflow-hidden border-b-2 border-black bg-neutral-100">
          <Image
            src={imgUrl}
            alt={caption}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </div>
        <div className="p-4 overflow-hidden">
          <p className="text-sm font-medium break-words line-clamp-3">{caption}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="overflow-hidden min-w-0 pr-2">
              <p className="text-xs font-black truncate">{uploaderName}</p>
              <p className="text-xs text-neutral-500 truncate">{formatDate(createdAt)}</p>
            </div>
            {canDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setConfirmOpen(true)}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-600">
            This action cannot be undone. The post by <strong>{uploaderName}</strong> will be permanently removed.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
