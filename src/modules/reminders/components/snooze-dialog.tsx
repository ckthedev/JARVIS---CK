"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    { label: "5 minutes", minutes: 5 },
    { label: "10 minutes", minutes: 10 },
    { label: "15 minutes", minutes: 15 },
    { label: "30 minutes", minutes: 30 },
    { label: "1 hour", minutes: 60 },
    { label: "Tomorrow (24h)", minutes: 1440 },
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
    >
      <div className="space-y-4 pt-2">
        {/* Quick presets */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
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
                className="h-10 text-xs border-border/80 bg-sidebar hover:bg-card-hover hover:border-primary/40 text-foreground justify-center"
              >
                +{opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 pt-3 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
            Custom Date & Time
          </span>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="h-9 text-xs bg-sidebar border-border/80"
            />
            <Button
              size="sm"
              disabled={!customDateTime || submitting}
              onClick={handleCustomSnooze}
              className="h-9 px-4 gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3.5 w-3.5" />
              Apply
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 pt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="text-xs text-secondary-text hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
