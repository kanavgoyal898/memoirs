"use client";

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
import { X, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { countryCodes } from "@/lib/countries";

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
        {question.description && (
          <p className="text-xs text-neutral-500">{question.description}</p>
        )}
        {helpText && <p className="text-xs text-neutral-500">{helpText}</p>}
        {children}
      </div>
    );
  }

  switch (question.type) {
    // ── Plain text inputs ──────────────────────────────────────────────────
    case "text":
      return wrap(
        <Input
          id={question.slug}
          type="text"
          placeholder={placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      );

    case "email":
      return wrap(
        <Input
          id={question.slug}
          type="email"
          placeholder={placeholder || "you@example.com"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      );

    case "url":
      return wrap(
        <Input
          id={question.slug}
          type="url"
          placeholder={placeholder || "https://"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      );

    case "number":
      return wrap(
        <Input
          id={question.slug}
          type="number"
          placeholder={placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      );

    case "date":
      return wrap(
        <Input
          id={question.slug}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      );

    // ── Long text ──────────────────────────────────────────────────────────
    case "textarea":
      return wrap(
        <Textarea
          id={question.slug}
          placeholder={placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    // ── Choice fields ──────────────────────────────────────────────────────
    case "select":
      return wrap(
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger id={question.slug}>
            <SelectValue placeholder={placeholder || "Select an option..."} />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "radio": {
      const selected = (value as string) ?? "";
      return wrap(
        <RadioGroup
          value={selected}
          onValueChange={onChange}
          className="flex flex-wrap gap-2 pt-1"
        >
          {(question.options ?? []).map((opt) => (
            <label
              key={opt}
              htmlFor={`${question.slug}-${opt}`}
              className={`flex items-center gap-2 px-4 py-2 border-2 border-black cursor-pointer text-sm font-bold transition-all select-none
                shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]
                ${selected === opt ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"}`}
            >
              <RadioGroupItem
                value={opt}
                id={`${question.slug}-${opt}`}
                className="sr-only"
              />
              {opt}
            </label>
          ))}
        </RadioGroup>
      );
    }

    case "checkbox": {
      const selected = (value as string[]) ?? [];
      return wrap(
        <div className="flex flex-col gap-3 pt-1">
          {(question.options ?? []).map((opt) => (
            <div key={opt} className="flex items-center gap-3">
              <Checkbox
                id={`${question.slug}-${opt}`}
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, opt]
                    : selected.filter((s) => s !== opt);
                  onChange(next);
                }}
              />
              <Label
                htmlFor={`${question.slug}-${opt}`}
                className="text-sm font-medium cursor-pointer"
              >
                {opt}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    case "multi-select": {
      const selected = (value as string[]) ?? [];
      return wrap(
        <MultiSelect
          options={question.options ?? []}
          selected={selected}
          onChange={onChange}
          placeholder={placeholder || "Select one or more options..."}
        />
      );
    }

    // ── Toggle ─────────────────────────────────────────────────────────────
    case "toggle":
      return (
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="space-y-0.5">
            <Label htmlFor={question.slug}>
              {question.label}
              {question.required && <span className="text-red-600 ml-1">*</span>}
            </Label>
            {question.description && (
              <p className="text-xs text-neutral-500">{question.description}</p>
            )}
            {helpText && <p className="text-xs text-neutral-500">{helpText}</p>}
          </div>
          <Switch
            id={question.slug}
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        </div>
      );

    // ── Media ──────────────────────────────────────────────────────────────
    case "image":
      return wrap(
        <div className="space-y-3">
          {!!value && (
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

    case "file":
      return wrap(
        <div className="space-y-3">
          {!!value && (
            <div className="flex items-center gap-3 border-2 border-black p-3 bg-white">
              <FileText className="h-5 w-5 shrink-0" />
              <span className="text-xs text-neutral-600 flex-1 truncate font-medium">
                File uploaded
              </span>
              <button
                onClick={() => onChange(null)}
                className="bg-black text-white p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {!value && (
            <FileUpload
              onUpload={onChange}
              label="Upload file"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
            />
          )}
        </div>
      );

    // ── Structured fields ──────────────────────────────────────────────────
    case "phone": {
      const phoneData = (value as { countryCode: string; number: string }) ?? {
        countryCode: (question.config as any)?.defaultCountryCode ?? "+91",
        number: "",
      };
      return wrap(
        <div className="flex flex-row items-center gap-2 w-full max-w-full">
          <div className="w-36 shrink-0">
            <Select
              value={phoneData.countryCode}
              onValueChange={(v) => onChange({ ...phoneData, countryCode: v })}
            >
              <SelectTrigger>
                <SelectValue>{phoneData.countryCode || "Code"}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countryCodes.map((c) => (
                  <SelectItem key={`${c.name}-${c.code}`} value={c.code}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            id={question.slug}
            type="tel"
            placeholder={placeholder || "Phone number"}
            value={phoneData.number}
            onChange={(e) => onChange({ ...phoneData, number: e.target.value })}
            className="flex-1"
          />
        </div>
      );
    }

    case "social_links": {
      const links = (value as Record<string, string>) ?? {};
      const platforms = question.options ?? ["Twitter", "LinkedIn", "Instagram", "GitHub"];
      return wrap(
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-black w-24 shrink-0 uppercase tracking-wider">
                {platform}
              </span>
              <Input
                placeholder={`${platform} URL`}
                value={links[platform] ?? ""}
                onChange={(e) => onChange({ ...links, [platform]: e.target.value })}
                className="w-full"
              />
            </div>
          ))}
        </div>
      );
    }

    case "key_value_list": {
      const pairs = (value as { key: string; value: string }[]) ?? [];
      return wrap(
        <div className="space-y-3">
          {pairs.map((pair, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="grid grid-cols-2 gap-2 flex-1">
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
              </div>
              <button
                onClick={() => onChange(pairs.filter((_, j) => j !== i))}
                className="border-2 border-black p-1.5 hover:bg-black hover:text-white transition-colors bg-white shrink-0"
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
