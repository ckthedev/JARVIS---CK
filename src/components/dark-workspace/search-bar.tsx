"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative flex-1 max-w-sm", className)}>
      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#737373]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-[#303030] bg-[#181818] pl-8 pr-8 text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:border-[#454545] focus:outline-none transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#F5F5F5] transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
