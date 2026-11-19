"use client";

import React from "react";
import { AlertTriangle, Trash2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

export function DarkConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmationDialogProps) {
  if (!open) return null;

  const variantButtonStyles = {
    danger: "bg-[#2A1818] hover:bg-[#351C1C] border border-[#502020] text-[#EF4444]",
    warning: "bg-[#383838] hover:bg-[#454545] text-[#F5F5F5] border border-[#484848]/40",
    primary: "bg-[#383838] hover:bg-[#454545] text-[#F5F5F5] border border-[#484848]/40",
  };

  const variantIcon = {
    danger: <Trash2 className="h-5 w-5 text-[#EF4444]" />,
    warning: <AlertTriangle className="h-5 w-5 text-[#A3A3A3]" />,
    primary: <CheckCircle2 className="h-5 w-5 text-[#A3A3A3]" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-[#303030] bg-[#202020] p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#262626] border border-[#303030]">
              {variantIcon[variant]}
            </div>
            <h3 className="text-base font-bold text-[#F5F5F5]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#F5F5F5] p-1 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="border-[#303030] bg-[#262626] hover:bg-[#2C2C2C] text-[#A3A3A3] text-xs h-8"
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className={`text-xs h-8 ${variantButtonStyles[variant]}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
