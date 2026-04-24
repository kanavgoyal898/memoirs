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
        <div className="w-full max-w-full min-w-0">
          <Input
            id={question.slug}
            type={question.type === "text" || question.type === "email" || question.type === "url" || question.type === "number" || question.type === "date" ? question.type : "text"}
            placeholder={placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
          />
        </div>
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
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={onChange}
          className="flex flex-col gap-3"
        >
          {(question.options ?? []).map((opt) => (
            <div key={opt} className="flex items-center gap-3">
              <RadioGroupItem value={opt} id={`${question.slug}-${opt}`} />
              <Label
                htmlFor={`${question.slug}-${opt}`}
                className="text-sm font-medium cursor-pointer"
              >
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case "checkbox": {
      const selected = (value as string[]) ?? [];
      return wrap(
        <div className="flex flex-col gap-3">
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
          placeholder={placeholder || "Select multiple..."}
        />
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

    case "social_links": {
      const links = (value as Record<string, string>) ?? {};
      const platforms = question.options ?? ["Twitter", "LinkedIn", "Instagram", "GitHub"];
      return wrap(
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-black w-20 shrink-0 uppercase tracking-wider">{platform}</span>
              <Input
                placeholder={`${platform} URL`}
                value={links[platform] ?? ""}
                onChange={(e) =>
                  onChange({ ...links, [platform]: e.target.value })
                }
                className="w-full"
              />
            </div>
          ))}
        </div>
      );
    }

    case "phone": {
      const phoneData = (value as { countryCode: string; number: string }) ?? {
        countryCode: (question.config as any)?.defaultCountryCode ?? "+91",
        number: "",
      };
      
      return wrap(
        <div className="flex flex-row items-center gap-2 w-full max-w-full">
          <div className="w-24 shrink-0">
            <Select
              value={phoneData.countryCode}
              onValueChange={(v) => onChange({ ...phoneData, countryCode: v })}
            >
              <SelectTrigger>
                {phoneData.countryCode || "Code"}
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

    case "key_value_list": {
      const pairs = (value as { key: string; value: string }[]) ?? [];
      return wrap(
        <div className="space-y-4">
          {pairs.map((pair, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center border-2 border-black p-3 sm:p-0 sm:border-0 bg-neutral-50 sm:bg-transparent">
              <div className="grid grid-cols-2 gap-2 w-full">
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
                className="self-end sm:self-auto border-2 border-black p-1.5 hover:bg-black hover:text-white transition-colors bg-white"
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
