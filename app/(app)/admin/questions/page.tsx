"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/providers/toast-provider";
import { Plus, Trash2, ArrowUp, ArrowDown, Edit } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Question {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  type: string;
  required: boolean;
  order: number;
  options: string[] | null;
}

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text (Paragraph)" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email Address" },
  { value: "url", label: "Website URL" },
  { value: "select", label: "Dropdown (Single Choice)" },
  { value: "radio", label: "Radio Buttons (Single Choice)" },
  { value: "checkbox", label: "Checkboxes (Multiple Choice)" },
  { value: "multi-select", label: "Multi-Select Dropdown" },
  { value: "image", label: "Single Image Upload" },
  { value: "gallery", label: "Image Gallery Upload" },
  { value: "file", label: "File Upload" },
  { value: "social_links", label: "Social Media Links" },
  { value: "key_value_list", label: "Key-Value List" },
  { value: "toggle", label: "Yes/No Toggle" }
];

const REQUIRES_OPTIONS = ["select", "radio", "checkbox", "multi-select"];

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    slug: string;
    label: string;
    description: string;
    type: string;
    required: boolean;
    options: string;
  }>({
    slug: "", label: "", description: "", type: "text", required: false, options: ""
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/questions");
    const data = await res.json();
    setQuestions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      slug: "", label: "", description: "", type: "text", required: false, options: ""
    });
    setDialogOpen(true);
  }

  function openEdit(q: Question) {
    setEditing(q);
    setForm({
      slug: q.slug,
      label: q.label,
      description: q.description ?? "",
      type: q.type,
      required: q.required,
      options: (q.options ?? []).join(", "),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: any = {
        label: form.label,
        description: form.description,
        type: form.type,
        required: form.required,
      };

      if (!editing) {
        payload.slug = form.slug;
        payload.order = questions.length;
      }

      if (REQUIRES_OPTIONS.includes(form.type)) {
        payload.options = form.options.split(",").map(s => s.trim()).filter(Boolean);
      } else {
        payload.options = null;
      }

      const url = editing ? `/api/questions/${editing.id}` : "/api/questions";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: editing ? "Question updated" : "Question created" });
      setDialogOpen(false);
      load();
    } catch (err) {
      toast({ title: "Failed to save", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    setDeleteId(id);
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/questions/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Question removed" });
      load();
    } catch {
      toast({ title: "Failed to remove question", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (index + direction < 0 || index + direction >= questions.length) return;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + direction];
    newQuestions[index + direction] = temp;

    setQuestions(newQuestions);

    try {
      await Promise.all(
        newQuestions.map((q, i) =>
          fetch(`/api/questions/${q.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: i }),
          })
        )
      );
    } catch {
      toast({ title: "Failed to reorder", variant: "destructive" });
      load();
    }
  }

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-black pb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Questions</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage dynamic fields for the yearbook profile.</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1" /> Add question
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-2 border-black h-24 animate-pulse bg-neutral-50" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="border-2 border-black p-16 text-center">
          <p className="font-black text-xl">No questions yet</p>
          <p className="text-sm text-neutral-500 mt-1">Create fields to collect information from users.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[4px_4px_0px_#000] bg-pastel-orange"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-lg">{q.label}</h3>
                  {q.required && <span className="text-xs font-black bg-black text-white px-1">REQUIRED</span>}
                  <span className="text-xs font-mono border-2 border-black px-1.5 py-0.5">
                    {FIELD_TYPES.find(t => t.value === q.type)?.label || q.type}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mt-1 font-mono">ID: {q.slug}</p>
                {q.description && <p className="text-sm mt-1">{q.description}</p>}
                {q.options && q.options.length > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">Options: {q.options.join(", ")}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1 mr-4">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMove(i, 1)} disabled={i === questions.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="icon" onClick={() => openEdit(q)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(q.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit question" : "Create question"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">


            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Favorite Memory"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Help text shown to users..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger disabled={!!editing}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editing && <p className="text-xs text-neutral-500">Type cannot be changed after creation to preserve data integrity.</p>}
              </div>

              <div className="space-y-2 flex flex-col justify-center pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.required}
                    onCheckedChange={(c) => setForm({ ...form, required: c })}
                  />
                  <Label>Required field</Label>
                </div>
              </div>
            </div>

            {REQUIRES_OPTIONS.includes(form.type) && (
              <div className="space-y-2">
                <Label htmlFor="options">Options (comma separated)</Label>
                <Input
                  id="options"
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.label}>
              {saving ? "Saving..." : "Save question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>This will hide the question from all users.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
