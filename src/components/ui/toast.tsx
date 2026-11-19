"use client";

import React from "react";
import { useToast, ToastItem } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const icons = {
    default: <Info className="h-5 w-5 text-primary" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    destructive: <AlertCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  };

  const borders = {
    default: "border-primary/40",
    success: "border-emerald-500/40",
    destructive: "border-red-500/40",
    warning: "border-amber-500/40",
  };

  const variant = toast.variant || "default";

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-4 text-foreground shadow-elevated transition-all duration-200 animate-in slide-in-from-bottom-2",
        borders[variant]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-secondary-text">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-secondary-text hover:text-foreground transition-colors p-1"
        aria-label="Dismiss toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
