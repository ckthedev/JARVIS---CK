"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = "md",
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full rounded-xl border border-[#303030] bg-[#262626] p-6 text-[#F5F5F5] shadow-2xl transition-all duration-200 animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {(title || description) && (
          <div className="mb-5 space-y-1 pr-6">
            {title && (
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#F5F5F5]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
