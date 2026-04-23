"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/file-upload";
import { urlFor } from "@/lib/sanity";
import Image from "next/image";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface DynamicFieldProps {
  question: Question;
  value: unknown;
  onChange: (val: unknown) => void;
}

export function DynamicField({ question, value, onChange }: DynamicFieldProps) {
  const config = (question.config as Record<string, string>) ?? {};
  const placeholder = config.placeholder ?? "";
  const helpText = config.helpText ?? "";

  function wrap(children: React.ReactNode) {
    return (
      <div className="space-y-2">
        <Label htmlFor={question.slug}>
          {question.label}
          {question.required && <span className="text-red-600 ml-1">*</span>}
        </Label>
        {helpText && <p className="text-xs text-neutral-500">{helpText}</p>}
        {children}
      </div>
    );
  }

  switch (question.type) {
    case "text":
    case "email":
    case "url":
    case "number":
    case "date":
      return wrap(
        <Input
          id={question.slug}
          type={question.type}
          placeholder={placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return wrap(
        <Textarea
          id={question.slug}
          placeholder={placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "select":
      return wrap(
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger id={question.slug}>
            <SelectValue placeholder={placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "radio":
      return wrap(
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.slug}
                value={opt}
                checked={(value as string) === opt}
                onChange={() => onChange(opt)}
                className="border-2 border-black"
              />
              <span className="text-sm font-medium">{opt}</span>
            </label>
          ))}
        </div>
      );

    case "checkbox":
    case "multi-select": {
      const selected = (value as string[]) ?? [];
      return wrap(
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => {
                  const next = selected.includes(opt)
                    ? selected.filter((s) => s !== opt)
                    : [...selected, opt];
                  onChange(next);
                }}
                className="border-2 border-black h-4 w-4"
              />
              <span className="text-sm font-medium">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    case "toggle":
      return wrap(
        <Switch
          id={question.slug}
          checked={Boolean(value)}
          onCheckedChange={onChange}
        />
      );

    case "image":
      return wrap(
        <div className="space-y-3">
          {value && (
            <div className="relative w-32 h-32 border-2 border-black">
              <Image
                src={urlFor(value as string).width(128).height(128).fit("crop").url()}
                alt="Uploaded"
                fill
                className="object-cover"
              />
              <button
                onClick={() => onChange(null)}
                className="absolute -top-2 -right-2 bg-black text-white p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {!value && (
            <FileUpload
              onUpload={onChange}
              label="Upload image"
              type="image"
            />
          )}
        </div>
      );

    case "gallery": {
      const images = (value as string[]) ?? [];
      const maxFiles = Number(config.maxFiles ?? 6);
      return wrap(
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square border-2 border-black">
                <Image
                  src={urlFor(img).width(200).height(200).fit("crop").url()}
                  alt={`Gallery ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 bg-black text-white p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {images.length < maxFiles && (
            <FileUpload
              onUpload={(id) => onChange([...images, id])}
              label={`Add image (${images.length}/${maxFiles})`}
              type="image"
            />
          )}
        </div>
      );
    }

    case "social_links": {
      const links = (value as Record<string, string>) ?? {};
      const platforms = question.options ?? ["Twitter", "LinkedIn", "Instagram", "GitHub"];
      return wrap(
        <div className="space-y-2">
          {platforms.map((platform) => (
            <div key={platform} className="flex items-center gap-2">
              <span className="text-xs font-black w-20 shrink-0">{platform}</span>
              <Input
                placeholder={`${platform} URL`}
                value={links[platform] ?? ""}
                onChange={(e) =>
                  onChange({ ...links, [platform]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      );
    }

    case "key_value_list": {
      const pairs = (value as { key: string; value: string }[]) ?? [];
      return wrap(
        <div className="space-y-2">
          {pairs.map((pair, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="Key"
                value={pair.key}
                onChange={(e) => {
                  const next = [...pairs];
                  next[i] = { ...next[i], key: e.target.value };
                  onChange(next);
                }}
              />
              <Input
                placeholder="Value"
                value={pair.value}
                onChange={(e) => {
                  const next = [...pairs];
                  next[i] = { ...next[i], value: e.target.value };
                  onChange(next);
                }}
              />
              <button
                onClick={() => onChange(pairs.filter((_, j) => j !== i))}
                className="border-2 border-black p-1 hover:bg-black hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...pairs, { key: "", value: "" }])}
          >
            <Plus className="h-3 w-3 mr-1" /> Add row
          </Button>
        </div>
      );
    }

    default:
      return null;
  }
}
