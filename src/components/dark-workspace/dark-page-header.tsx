"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DarkPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DarkPageHeader({
  title,
  description,
  backHref,
  backLabel,
  badge,
  children,
  className,
}: DarkPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#303030]",
        className
      )}
    >
      <div className="space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{backLabel || "Back"}</span>
          </Link>
        )}
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-[#262626] border border-[#303030] px-2 py-0.5 text-[11px] font-medium text-[#A3A3A3]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
