"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { SocialPostDto } from "../types";

interface RescheduleDialogProps {
  post: SocialPostDto | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: SocialPostDto) => void;
}

export function RescheduleDialog({
  post,
  open,
  onClose,
  onSuccess,
}: RescheduleDialogProps) {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post && open) {
      setError(null);
      const initial = post.plannedAt ? new Date(post.plannedAt) : new Date(Date.now() + 86400000);
      const yyyy = initial.getFullYear();
      const mm = String(initial.getMonth() + 1).padStart(2, "0");
      const dd = String(initial.getDate()).padStart(2, "0");
      const hh = String(initial.getHours()).padStart(2, "0");
      const min = String(initial.getMinutes()).padStart(2, "0");

      setDateStr(`${yyyy}-${mm}-${dd}`);
      setTimeStr(`${hh}:${min}`);
    }
  }, [post, open]);

  if (!post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr || !timeStr) {
      setError("Please select both date and time.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const combined = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(combined.getTime())) {
        throw new Error("Invalid date or time");
      }

      const res = await fetch(`/api/social/posts/${post.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plannedAt: combined.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reschedule post");
      }

      const data = await res.json();
      onSuccess(data.post);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error rescheduling post";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (daysFromNow: number, hour: number, minute: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    const hh = String(hour).padStart(2, "0");
    const min = String(minute).padStart(2, "0");

    setDateStr(`${yyyy}-${mm}-${dd}`);
    setTimeStr(`${hh}:${min}`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reschedule Publishing Date"
      description={`Update planned publishing schedule for "${post.title}". Associated reminders will synchronize automatically.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="block text-[11px] text-secondary-text uppercase font-semibold">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreset(1, 10, 0)}
              className="text-xs h-7"
            >
              Tomorrow 10:00 AM
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreset(2, 14, 0)}
              className="text-xs h-7"
            >
              In 2 Days 2:00 PM
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreset(7, 10, 0)}
              className="text-xs h-7"
            >
              Next Week
            </Button>
          </div>
        </div>

        {/* Date & Time Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary-text flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Date
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary-text flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Time (IST)
            </label>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
        </div>

        <p className="text-[11px] text-secondary-text">
          Timezone: <span className="text-foreground font-medium">Asia/Kolkata (IST)</span>
        </p>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="text-xs"
          >
            {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Save Schedule
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
