"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MeetingDto } from "../types";

interface DeleteMeetingDialogProps {
  meeting: MeetingDto | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (meetingId: string, permanent: boolean) => Promise<void>;
}

export function DeleteMeetingDialog({
  meeting,
  isOpen,
  onClose,
  onConfirm,
}: DeleteMeetingDialogProps) {
  const [permanent, setPermanent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!meeting) return null;

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await onConfirm(meeting.id, permanent);
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
      title="Delete Meeting"
      description={`Are you sure you want to remove "${meeting.title}"?`}
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

        <p className="text-[11px] text-[#737373] leading-tight">
          Note: Any linked follow-up tasks, discussion notes, or file attachments will be preserved safely.
        </p>

        <div className="border-t border-[#303030] pt-4 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={submitting}
            className="text-xs font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? "Deleting..." : "Delete Meeting"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
