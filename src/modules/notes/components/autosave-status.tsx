"use client";

import React from "react";
import { Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveState = "saved" | "saving" | "unsaved" | "error";

interface AutosaveStatusProps {
  state: SaveState;
  lastSavedAt?: Date | null;
  onRetry?: () => void;
  className?: string;
}

export function AutosaveStatus({
  state,
  lastSavedAt,
  onRetry,
  className,
}: AutosaveStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs select-none transition-colors",
        state === "saving" && "text-primary",
        state === "saved" && "text-secondary-text",
        state === "unsaved" && "text-amber-400",
        state === "error" && "text-red-400",
        className
      )}
    >
      {state === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span>Saving...</span>
        </>
      )}

      {state === "saved" && (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span>
            Saved
            {lastSavedAt && (
              <span className="hidden sm:inline text-[11px] text-secondary-text/80 ml-1">
                {new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                }).format(new Date(lastSavedAt))}
              </span>
            )}
          </span>
        </>
      )}

      {state === "unsaved" && (
        <>
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Unsaved changes</span>
        </>
      )}

      {state === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-red-400" />
          <span>Failed to save</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-1 flex items-center gap-1 underline hover:text-red-300 font-medium cursor-pointer"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}
