"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2A1818] text-[#EF4444] border border-[#4A2020]">
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F5]">{title}</h3>
          <p className="text-xs text-[#A3A3A3] leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}
