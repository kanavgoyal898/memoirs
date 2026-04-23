"use client";

import * as React from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option];
    onChange(next);
  };

  const removeOption = (e: React.MouseEvent, option: string) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== option));
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          "flex min-h-[40px] w-full items-center justify-between border-2 border-black bg-white px-3 py-2 text-sm cursor-pointer transition-shadow",
          open && "ring-2 ring-black"
        )}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 && (
            <span className="text-neutral-400">{placeholder}</span>
          )}
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 bg-black text-white px-2 py-0.5 text-xs font-black"
            >
              {s}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-400"
                onClick={(e) => removeOption(e, s)}
              />
            </span>
          ))}
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full border-2 border-black bg-white shadow-[4px_4px_0px_#000] max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-neutral-500">No options available</div>
          ) : (
            options.map((opt) => (
              <div
                key={opt}
                onClick={() => toggleOption(opt)}
                className={cn(
                  "flex items-center justify-between p-2 text-sm font-medium cursor-pointer hover:bg-neutral-100 transition-colors",
                  selected.includes(opt) && "bg-pastel-pink hover:bg-pastel-pink/80"
                )}
              >
                {opt}
                {selected.includes(opt) && <Check className="h-4 w-4" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
