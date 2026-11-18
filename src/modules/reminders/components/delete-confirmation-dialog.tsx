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
    >
      <div className="space-y-4 pt-2">
        <label className="flex items-center gap-2.5 text-xs text-secondary-text cursor-pointer hover:text-foreground">
          <input
            type="checkbox"
            checked={permanent}
            onChange={(e) => setPermanent(e.target.checked)}
            className="rounded border-border/80 bg-[#0A101C] text-primary focus:ring-primary"
          />
          <span>Permanently delete from database (cannot be restored)</span>
        </label>

        <div className="border-t border-border/60 pt-4 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="text-xs text-secondary-text hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={submitting}
            className="gap-1.5 text-xs font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {permanent ? "Permanently Delete" : "Move to Trash / Delete"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
