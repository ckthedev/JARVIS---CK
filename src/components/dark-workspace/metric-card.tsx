"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
  accentColor?: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = "#8B5CF6",
  accentColor,
  href,
  active,
  onClick,
  className,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "rounded-xl border border-[#303030] bg-[#202020] p-4 flex flex-col justify-between transition-colors relative overflow-hidden group",
        (href || onClick) && "hover:bg-[#2C2C2C] hover:border-[#3C3C3C] cursor-pointer",
        active && "border-l-4",
        className
      )}
      style={active && accentColor ? { borderLeftColor: accentColor } : undefined}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#262626] border border-[#303030]"
            style={{ color: iconColor }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">
          {value}
        </span>
        {subtext && (
          <span className="text-xs text-[#737373] truncate">{subtext}</span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
