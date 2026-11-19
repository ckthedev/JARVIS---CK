import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl bg-[#181818]/40 p-8 text-center",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#222222] border border-[#292929] text-[#737373] mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-[#F5F5F5]">{title}</h3>
      <p className="mt-1 text-xs text-[#737373] max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
