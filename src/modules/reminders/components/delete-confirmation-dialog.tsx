"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReminderDto } from "../types";

interface DeleteConfirmationDialogProps {
  reminder: ReminderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reminderId: string, permanent: boolean) => Promise<void>;
}

export function DeleteConfirmationDialog({
  reminder,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const [permanent, setPermanent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!reminder) return null;

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await onConfirm(reminder.id, permanent);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Delete Reminder"
      description={`Are you sure you want to remove "${reminder.title}"?`}
      maxWidth="md"
      className="bg-[#141414] border-[#303030] text-[#F5F5F5]"
    >
      <div className="space-y-4 pt-2">
        <label className="flex items-center gap-2.5 text-xs text-[#A3A3A3] cursor-pointer hover:text-[#F5F5F5]">
          <input
            type="checkbox"
            checked={permanent}
            onChange={(e) => setPermanent(e.target.checked)}
            className="rounded border-[#303030] bg-[#181818] text-[#8B5CF6] focus:ring-[#8B5CF6]"
          />
          <span>Permanently delete from database (cannot be restored)</span>
        </label>

        <div className="border-t border-[#303030] pt-4 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={submitting}
            className="gap-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{permanent ? "Permanently Delete" : "Delete Reminder"}</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
