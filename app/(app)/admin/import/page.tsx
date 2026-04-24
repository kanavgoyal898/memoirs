"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ParsedRow {
  email: string;
  role: string;
  password: string;
}

interface RowError {
  row: number;
  data: Partial<ParsedRow>;
  errors: string[];
}

interface PreviewData {
  valid: ParsedRow[];
  errors: RowError[];
}

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: RowError[];
}

export default function AdminImportPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const parseFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".csv")) {
      toast({ title: "File must be a CSV", variant: "destructive" });
      return;
    }
    if (f.size > 1024 * 1024) {
      toast({ title: "File too large (max 1MB)", variant: "destructive" });
      return;
    }
    setParsing(true);
    setResult(null);

    const { parseCsvFile, deduplicateCsvRows } = await import("@/lib/csv");
    const text = await f.text();
    const { valid, errors } = parseCsvFile(text);
    setPreview({ valid: deduplicateCsvRows(valid), errors });
    setFile(f);
    setParsing(false);
  }, [toast]);

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/users/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setPreview(null);
      setFile(null);
      toast({ title: `Import complete: ${data.created} created, ${data.updated} updated` });
    } catch (err) {
      toast({ title: "Import failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
  }

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-black pb-6">
        <h1 className="text-3xl font-black">Bulk Import</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Upload a CSV to create or update users. Format: <code className="font-black bg-neutral-100 px-1">email,role,password</code>
        </p>
      </div>

      {!preview && !result && (
        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed border-black p-16 cursor-pointer transition-colors ${dragOver ? "bg-neutral-100" : "hover:bg-neutral-50"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) parseFile(f);
          }}
        >
          <Upload className="h-10 w-10 mb-4" />
          <p className="font-black text-lg text-center">{parsing ? "Parsing..." : "Drop CSV here or click to browse"}</p>
          <p className="text-sm text-neutral-500 mt-1">Max 1MB</p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            disabled={parsing}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
          />
        </label>
      )}

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <span className="border-2 border-black px-3 py-1 text-sm font-black">
                {preview.valid.length} valid
              </span>
              {preview.errors.length > 0 && (
                <span className="border-2 border-black bg-black text-white px-3 py-1 text-sm font-black">
                  {preview.errors.length} errors
                </span>
              )}
            </div>

            {preview.valid.length > 0 && (
              <div className="border-2 border-black overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="text-left px-4 py-2 font-black">Email</th>
                      <th className="text-left px-4 py-2 font-black">Role</th>
                      <th className="text-left px-4 py-2 font-black">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {preview.valid.map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2 font-black">{row.role}</td>
                        <td className="px-4 py-2">
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="h-3 w-3" /> Valid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {preview.errors.length > 0 && (
              <div className="border-2 border-black overflow-x-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-black text-white">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-black text-sm">Invalid rows (will be skipped)</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y-2 divide-black">
                    {preview.errors.map((err, i) => (
                      <tr key={i} className="bg-red-50">
                        <td className="px-4 py-2 font-medium">Row {err.row}: {err.data.email ?? "—"}</td>
                        <td className="px-4 py-2 text-red-700">{err.errors.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={reset}>Cancel</Button>
              <Button onClick={handleImport} disabled={importing || preview.valid.length === 0}>
                {importing ? "Importing..." : `Import ${preview.valid.length} users`}
              </Button>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="border-2 border-black p-6 shadow-[4px_4px_0px_#000]">
              <h2 className="font-black text-lg mb-4">Import complete</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-black p-4 text-center">
                  <p className="text-3xl font-black">{result.created}</p>
                  <p className="text-xs font-bold text-neutral-500 mt-1">Created</p>
                </div>
                <div className="border-2 border-black p-4 text-center">
                  <p className="text-3xl font-black">{result.updated}</p>
                  <p className="text-xs font-bold text-neutral-500 mt-1">Updated</p>
                </div>
                <div className={`border-2 border-black p-4 text-center ${result.failed > 0 ? "bg-black text-white" : ""}`}>
                  <p className="text-3xl font-black">{result.failed}</p>
                  <p className={`text-xs font-bold mt-1 ${result.failed > 0 ? "text-neutral-300" : "text-neutral-500"}`}>Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4 space-y-1">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{err.data.email ?? `Row ${err.row}`}: {err.errors.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={reset}>Import another file</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
