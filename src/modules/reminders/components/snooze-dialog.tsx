"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReminderDto } from "../types";

interface SnoozeDialogProps {
  reminder: ReminderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSnooze: (reminderId: string, durationMinutes?: number, customDate?: string) => Promise<void>;
}

export function SnoozeDialog({
  reminder,
  isOpen,
  onClose,
  onSnooze,
}: SnoozeDialogProps) {
  const [customDateTime, setCustomDateTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!reminder) return null;

  const quickOptions = [
    { label: "5 mins", minutes: 5 },
    { label: "10 mins", minutes: 10 },
    { label: "15 mins", minutes: 15 },
    { label: "30 mins", minutes: 30 },
    { label: "1 hour", minutes: 60 },
    { label: "Tomorrow", minutes: 1440 },
  ];

  const handleQuickSnooze = async (minutes: number) => {
    try {
      setSubmitting(true);
      await onSnooze(reminder.id, minutes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomSnooze = async () => {
    if (!customDateTime) return;
    try {
      setSubmitting(true);
      await onSnooze(reminder.id, undefined, new Date(customDateTime).toISOString());
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
      title="Snooze Reminder"
      description={`Postpone alert for "${reminder.title}".`}
      maxWidth="md"
      className="bg-[#141414] border-[#303030] text-[#F5F5F5]"
    >
      <div className="space-y-4 pt-2">
        {/* Quick presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Quick Snooze Presets
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickOptions.map((opt) => (
              <Button
                key={opt.minutes}
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => handleQuickSnooze(opt.minutes)}
                className="h-9 text-xs border-[#303030] bg-[#181818] hover:bg-[#202020] hover:border-[#8B5CF6]/50 text-[#F5F5F5] justify-center"
              >
                +{opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#303030] pt-3 space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
            Custom Date & Time
          </span>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            />
            <Button
              size="sm"
              disabled={submitting || !customDateTime}
              onClick={handleCustomSnooze}
              className="text-xs bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium"
            >
              Set Snooze
            </Button>
          </div>
        </div>

        <div className="border-t border-[#303030] pt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
