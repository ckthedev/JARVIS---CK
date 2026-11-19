"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type MasterPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | string;

interface PriorityBadgeProps {
  priority: MasterPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const norm = priority?.toUpperCase() || "NORMAL";

  let styles = "bg-[#222222] text-[#A3A3A3] border-[#303030]";
  let label = "Normal";

  if (norm === "CRITICAL") {
    styles = "bg-[#2A1818] text-[#EF4444] border-[#4A2020]";
    label = "Critical";
  } else if (norm === "HIGH") {
    styles = "bg-[#262626] text-[#F5F5F5] border-[#383838]";
    label = "High";
  } else if (norm === "NORMAL") {
    styles = "bg-[#222222] text-[#A3A3A3] border-[#303030]";
    label = "Normal";
  } else if (norm === "LOW") {
    styles = "bg-[#1C1C1C] text-[#737373] border-[#292929]";
    label = "Low";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.2 text-[9px] font-medium tracking-wide uppercase",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
