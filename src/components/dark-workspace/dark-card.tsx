"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DarkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
  noPadding?: boolean;
}

export function DarkCard({
  variant = "default",
  noPadding = false,
  className,
  children,
  ...props
}: DarkCardProps) {
  const variantStyles = {
    default: "bg-[#202020] border-[#303030]",
    elevated: "bg-[#262626] border-[#303030]",
    interactive:
      "bg-[#202020] border-[#303030] hover:bg-[#2C2C2C] hover:border-[#3C3C3C] cursor-pointer transition-colors",
  };

  return (
    <div
      className={cn(
        "rounded-xl border",
        variantStyles[variant],
        noPadding ? "" : "p-4 sm:p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
