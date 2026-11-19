"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export function DarkLoadingSkeleton({
  count = 3,
  height = "h-24",
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-full rounded-xl border border-[#303030] bg-[#202020] animate-pulse",
            height
          )}
        />
      ))}
    </div>
  );
}
