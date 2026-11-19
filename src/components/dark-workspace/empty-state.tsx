"use client";

import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: { label: string; onClick: () => void } | React.ReactNode;
  className?: string;
}

export function DarkEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
}: EmptyStateProps) {
  const resolvedActionLabel =
    actionLabel ||
    (action && typeof action === "object" && "label" in action
      ? (action as { label: string }).label
      : undefined);
  const resolvedOnAction =
    onAction ||
    (action && typeof action === "object" && "onClick" in action
      ? (action as { onClick: () => void }).onClick
      : undefined);

  return (
    <div
      className={cn(
        "rounded-xl bg-[#181818]/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#222222] border border-[#292929] text-[#737373] mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-[#F5F5F5] tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-xs text-[#737373] max-w-sm">
          {description}
        </p>
      )}
      {resolvedActionLabel && resolvedOnAction && (
        <Button
          size="sm"
          onClick={resolvedOnAction}
          className="mt-4 bg-[#383838] hover:bg-[#454545] text-[#F5F5F5] border border-[#404040]/40 text-xs h-8"
        >
          {resolvedActionLabel}
        </Button>
      )}
      {action && React.isValidElement(action) && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}

export const EmptyState = DarkEmptyState;
