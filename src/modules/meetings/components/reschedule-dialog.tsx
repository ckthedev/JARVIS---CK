"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MeetingDto } from "../types";

interface RescheduleDialogProps {
  meeting: MeetingDto | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (id: string, startTime: string, endTime: string) => Promise<void>;
}

export function RescheduleDialog({
  meeting,
  isOpen,
  onClose,
  onReschedule,
}: RescheduleDialogProps) {
  const [dateStr, setDateStr] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("10:00");
  const [endTimeStr, setEndTimeStr] = useState("11:00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meeting) {
      const start = new Date(meeting.startTime);
      const end = new Date(meeting.endTime);
      setDateStr(format(start, "yyyy-MM-dd"));
      setStartTimeStr(format(start, "HH:mm"));
      setEndTimeStr(format(end, "HH:mm"));
      setError(null);
    }
  }, [meeting, isOpen]);

  if (!meeting) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dateStr || !startTimeStr || !endTimeStr) {
      setError("Please fill out date, start time, and end time.");
      return;
    }

    const startIso = `${dateStr}T${startTimeStr}:00+05:30`;
    const endIso = `${dateStr}T${endTimeStr}:00+05:30`;

    const start = new Date(startIso);
    const end = new Date(endIso);

    if (end.getTime() <= start.getTime()) {
      setError("End time must be strictly after start time.");
      return;
    }

    try {
      setLoading(true);
      await onReschedule(meeting.id, start.toISOString(), end.toISOString());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reschedule meeting";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Reschedule Meeting"
      description={`Move "${meeting.title}" to a new date and time.`}
      maxWidth="md"
      className="bg-[#141414] border-[#303030] text-[#F5F5F5]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">
            New Date
          </label>
          <input
            type="date"
            required
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A3A3A3] mb-1.5">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTimeStr}
              onChange={(e) => setEndTimeStr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            />
          </div>
        </div>

        <div className="border-t border-[#303030] pt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="text-xs font-medium bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
          >
            {loading ? "Rescheduling..." : "Confirm Reschedule"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
