"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type MasterStatus =
  | "IDEA"
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED"
  | "SCHEDULED_MEETING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "PENDING"
  | "SNOOZED"
  | "ACTIVE"
  | "OVERDUE"
  | string;

interface StatusBadgeProps {
  status: MasterStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const norm = status?.toUpperCase() || "";

  let styles = "bg-[#202020] text-[#A3A3A3] border-[#303030]";
  let dotColor = "#737373";

  if (norm === "CANCELLED" || norm === "NO_SHOW" || norm === "OVERDUE") {
    styles = "bg-[#2A1818] text-[#EF4444] border-[#4A2020]";
    dotColor = "#EF4444";
  } else if (norm === "COMPLETED" || norm === "PUBLISHED") {
    styles = "bg-[#242424] text-[#E5E5E5] border-[#383838]";
    dotColor = "#A3A3A3";
  } else if (norm === "IN_REVIEW" || norm === "IN_PROGRESS") {
    styles = "bg-[#262626] text-[#F5F5F5] border-[#383838]";
    dotColor = "#D4D4D4";
  } else if (norm === "APPROVED" || norm === "SCHEDULED" || norm === "SCHEDULED_MEETING") {
    styles = "bg-[#222222] text-[#D4D4D4] border-[#343434]";
    dotColor = "#999999";
  } else {
    styles = "bg-[#202020] text-[#A3A3A3] border-[#292929]";
    dotColor = "#737373";
  }

  const displayLabel = label || norm.replace("_", " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
        styles,
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span>{displayLabel}</span>
    </span>
  );
}
