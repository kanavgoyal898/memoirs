"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onUpload: (assetId: string) => void;
  accept?: string;
  type?: "image" | "file";
  label?: string;
  maxSizeMb?: number;
}

export function FileUpload({
  onUpload,
  accept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif",
  type = "image",
  label = "Upload file",
  maxSizeMb = 5,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const upload = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast({ title: `File too large (max ${maxSizeMb}MB)`, variant: "destructive" });
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", type);

        const res = await fetch("/api/media/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Upload failed");

        onUpload(data.assetId);
        toast({ title: "Uploaded successfully" });
      } catch (err) {
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [maxSizeMb, onUpload, toast, type]
  );

  return (
    <label
      className={`flex flex-col items-center justify-center border-2 border-dashed border-black p-8 cursor-pointer transition-colors ${dragOver ? "bg-neutral-100" : "bg-pastel-blue hover:bg-pastel-purple"}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) upload(file);
      }}
    >
      <Upload className="h-8 w-8 mb-2" />
      <span className="text-sm font-bold">{uploading ? "Uploading..." : label}</span>
      <span className="text-xs text-neutral-500 mt-1">Max {maxSizeMb}MB</span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
    </label>
  );
}
