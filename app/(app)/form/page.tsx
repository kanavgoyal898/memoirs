"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DynamicField } from "@/components/dynamic-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { useToast } from "@/components/providers/toast-provider";
import { urlFor } from "@/lib/sanity";
import Image from "next/image";
import { X } from "lucide-react";

interface Question {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  type: string;
  required: boolean;
  options?: string[] | null;
  validation?: Record<string, unknown> | null;
  config?: Record<string, unknown> | null;
}

export default function FormPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [meta, setMeta] = useState({ firstName: "", lastName: "", quote: "", profileImage: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const [qRes, rRes, mRes] = await Promise.all([
      fetch("/api/questions"),
      fetch("/api/responses"),
      fetch("/api/me"),
    ]);
    const qData = await qRes.json();
    const rData = await rRes.json();
    const mData = await mRes.json();

    setQuestions(qData);
    setAnswers(rData.answers ?? {});
    setMeta({
      firstName: mData.firstName ?? "",
      lastName: mData.lastName ?? "",
      quote: mData.quote ?? "",
      profileImage: mData.profileImage ?? "",
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function setAnswer(slug: string, val: unknown) {
    setAnswers((prev) => ({ ...prev, [slug]: val }));
    setDirty(true);
  }

  function setMetaField(field: string, val: string) {
    setMeta((prev) => ({ ...prev, [field]: val }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const [rRes, uRes] = await Promise.all([
        fetch("/api/responses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        }),
        fetch("/api/me/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(meta),
        }),
      ]);
      if (!rRes.ok || !uRes.ok) throw new Error();
      toast({ title: "Profile saved" });
      setDirty(false);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const requiredSlugs = questions.filter((q) => q.required).map((q) => q.slug);
  const answeredRequired = requiredSlugs.filter((s) => {
    const v = answers[s];
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
  const completion = requiredSlugs.length
    ? Math.round((answeredRequired.length / requiredSlugs.length) * 100)
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm font-medium text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="border-b-2 border-black pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black">My Profile</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {completion}% of required fields complete
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <span className="text-xs font-black border-2 border-black px-2 py-1 bg-black text-white">
              UNSAVED
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </div>

      <div className="w-full bg-neutral-100 border-2 border-black h-2">
        <motion.div
          className="h-full bg-black"
          initial={{ width: 0 }}
          animate={{ width: `${completion}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <section className="space-y-6 border-2 border-black p-6 shadow-[4px_4px_0px_#000]">
        <h2 className="font-black text-lg border-b-2 border-black pb-3">Basic Information</h2>

        <div className="space-y-2">
          <Label>Profile Photo</Label>
          {meta.profileImage ? (
            <div className="relative w-24 h-24 border-2 border-black">
              <Image
                src={urlFor(meta.profileImage).width(96).height(96).fit("crop").url()}
                alt="Profile"
                fill
                className="object-cover"
              />
              <button
                onClick={() => setMetaField("profileImage", "")}
                className="absolute -top-2 -right-2 bg-black text-white p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <FileUpload
              onUpload={(id) => setMetaField("profileImage", id)}
              label="Upload photo"
              type="image"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name <span className="text-red-600">*</span></Label>
            <Input
              id="firstName"
              value={meta.firstName}
              onChange={(e) => setMetaField("firstName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name <span className="text-red-600">*</span></Label>
            <Input
              id="lastName"
              value={meta.lastName}
              onChange={(e) => setMetaField("lastName", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quote">Quote <span className="text-red-600">*</span></Label>
          <Textarea
            id="quote"
            placeholder="Your memorable quote for the yearbook..."
            value={meta.quote}
            onChange={(e) => setMetaField("quote", e.target.value)}
          />
        </div>
      </section>

      {questions.length === 0 ? (
        <div className="border-2 border-black p-10 text-center">
          <p className="font-black text-lg">No questions yet</p>
          <p className="text-sm text-neutral-500 mt-1">
            An admin will add questions shortly.
          </p>
        </div>
      ) : (
        <section className="space-y-6 border-2 border-black p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="font-black text-lg border-b-2 border-black pb-3">Yearbook Questions</h2>
          {questions.map((q) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <DynamicField
                question={q}
                value={answers[q.slug]}
                onChange={(val) => setAnswer(q.slug, val)}
              />
            </motion.div>
          ))}
        </section>
      )}

      <div className="flex justify-end pb-10">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
