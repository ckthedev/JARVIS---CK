"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Repeat,
  Link as LinkIcon,
  AlertCircle,
  Check,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ReminderDto,
  ReminderPriority,
  RecurrenceRule,
  MissedReminderPolicy,
} from "../types";
import { CreateReminderInput } from "@/lib/validations/reminder";
import { cn } from "@/lib/utils";

interface ReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: ReminderDto | null;
  onSave: (data: CreateReminderInput) => Promise<void>;
  defaultSection?: string;
}

export function ReminderDialog({
  isOpen,
  onClose,
  reminder,
  onSave,
  defaultSection,
}: ReminderDialogProps) {
  const isEditing = Boolean(reminder);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<ReminderPriority>("NORMAL");
  const [taskId, setTaskId] = useState<string>("");
  const [meetingId, setMeetingId] = useState<string>("");
  const [offsetMinutes, setOffsetMinutes] = useState<number | null>(null);
  const [missedPolicy, setMissedPolicy] = useState<MissedReminderPolicy>("NOTIFY_IMMEDIATELY");

  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>("DAILY");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceEndAt, setRecurrenceEndAt] = useState("");

  // External options
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([]);
  const [meetings, setMeetings] = useState<
    Array<{ id: string; title: string; startTime: string }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format Date into YYYY-MM-DDTHH:mm for datetime-local input
  const formatForInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (reminder) {
        setTitle(reminder.title);
        setDescription(reminder.description || "");
        setDueAt(formatForInput(new Date(reminder.dueAt)));
        setPriority(reminder.priority);
        setTaskId(reminder.taskId || "");
        setMeetingId(reminder.meetingId || "");
        setOffsetMinutes(reminder.offsetMinutes ?? null);
        setMissedPolicy(reminder.missedPolicy || "NOTIFY_IMMEDIATELY");
        setIsRecurring(Boolean(reminder.isRecurring));
        setRecurrenceRule(reminder.recurrenceRule || "DAILY");
        setRecurrenceInterval(reminder.recurrenceInterval || 1);
        setRecurrenceDaysOfWeek(reminder.recurrenceDaysOfWeek || []);
        setRecurrenceEndAt(
          reminder.recurrenceEndAt
            ? formatForInput(new Date(reminder.recurrenceEndAt))
            : ""
        );
      } else {
        // New reminder defaults
        setTitle("");
        setDescription("");
        const defaultDue = new Date(Date.now() + 60 * 60 * 1000);
        defaultDue.setMinutes(0, 0, 0);
        setDueAt(formatForInput(defaultDue));
        setPriority("NORMAL");
        setTaskId("");
        setMeetingId("");
        setOffsetMinutes(null);
        setMissedPolicy("NOTIFY_IMMEDIATELY");
        setIsRecurring(defaultSection === "recurring");
        setRecurrenceRule("DAILY");
        setRecurrenceInterval(1);
        setRecurrenceDaysOfWeek([]);
        setRecurrenceEndAt("");
      }

      // Fetch active tasks & meetings
      Promise.all([
        fetch("/api/tasks?limit=50")
          .then((r) => (r.ok ? r.json() : { tasks: [] }))
          .then((d) => setTasks(d.tasks || [])),
        fetch("/api/meetings")
          .then((r) => (r.ok ? r.json() : { meetings: [] }))
          .then((d) => setMeetings(d.meetings || [])),
      ]).catch(console.error);
    }
  }, [isOpen, reminder, defaultSection]);

  const toggleDayOfWeek = (day: number) => {
    if (recurrenceDaysOfWeek.includes(day)) {
      setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter((d) => d !== day));
    } else {
      setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, day].sort());
    }
  };

  const handleMeetingChange = (mId: string) => {
    setMeetingId(mId);
    if (mId) {
      const selected = meetings.find((m) => m.id === mId);
      if (selected) {
        const offset = offsetMinutes !== null ? offsetMinutes : 10;
        setOffsetMinutes(offset);
        const mTime = new Date(selected.startTime).getTime();
        setDueAt(formatForInput(new Date(mTime - offset * 60 * 1000)));
      }
    } else {
      setOffsetMinutes(null);
    }
  };

  const handleOffsetChange = (mins: number) => {
    setOffsetMinutes(mins);
    if (meetingId) {
      const selected = meetings.find((m) => m.id === meetingId);
      if (selected) {
        const mTime = new Date(selected.startTime).getTime();
        setDueAt(formatForInput(new Date(mTime - mins * 60 * 1000)));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!dueAt) {
      setError("Due date and time is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateReminderInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: new Date(dueAt).toISOString(),
        priority,
        taskId: taskId || null,
        meetingId: meetingId || null,
        offsetMinutes: meetingId ? offsetMinutes : null,
        missedPolicy,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : null,
        recurrenceInterval: isRecurring ? recurrenceInterval : 1,
        recurrenceDaysOfWeek:
          isRecurring && recurrenceRule === "WEEKLY" ? recurrenceDaysOfWeek : [],
        recurrenceEndAt:
          isRecurring && recurrenceEndAt
            ? new Date(recurrenceEndAt).toISOString()
            : null,
      };

      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const weekdays = [
    { label: "S", day: 0 },
    { label: "M", day: 1 },
    { label: "T", day: 2 },
    { label: "W", day: 3 },
    { label: "T", day: 4 },
    { label: "F", day: 5 },
    { label: "S", day: 6 },
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Reminder" : "Create New Reminder"}
      description={
        isEditing
          ? "Update reminder alert triggers and schedule parameters."
          : "Schedule a time-critical alert or recurring reminder."
      }
      maxWidth="lg"
      className="bg-[#141414] border-[#303030] text-[#F5F5F5]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="reminder-title" className="text-xs text-[#A3A3A3]">
            Reminder Title <span className="text-[#8B5CF6]">*</span>
          </Label>
          <input
            id="reminder-title"
            placeholder="What needs reminding?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="reminder-desc" className="text-xs text-[#A3A3A3]">
            Description (optional)
          </Label>
          <textarea
            id="reminder-desc"
            placeholder="Additional notes, instructions or context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] resize-none"
          />
        </div>

        {/* Due Date & Time & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reminder-due" className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
              <Clock className="h-3.5 w-3.5 text-[#8B5CF6]" />
              Due Date & Time <span className="text-[#8B5CF6]">*</span>
            </Label>
            <input
              id="reminder-due"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reminder-priority" className="text-xs text-[#A3A3A3]">
              Priority
            </Label>
            <select
              id="reminder-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReminderPriority)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            >
              <option value="CRITICAL" className="bg-[#181818] text-[#F5F5F5]">Critical</option>
              <option value="HIGH" className="bg-[#181818] text-[#F5F5F5]">High</option>
              <option value="NORMAL" className="bg-[#181818] text-[#F5F5F5]">Normal</option>
              <option value="LOW" className="bg-[#181818] text-[#F5F5F5]">Low</option>
            </select>
          </div>
        </div>

        {/* Links section: Task & Meeting */}
        <div className="p-3 rounded-lg border border-[#303030] bg-[#181818] space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F5F5]">
            <LinkIcon className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span>Linked Resources (Optional)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Task Picker */}
            <div className="space-y-1">
              <span className="text-[11px] text-[#737373]">Link to Task</span>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              >
                <option value="">None (Independent Reminder)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting Picker */}
            <div className="space-y-1">
              <span className="text-[11px] text-[#737373]">Link to Meeting</span>
              <select
                value={meetingId}
                onChange={(e) => handleMeetingChange(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              >
                <option value="">None (Independent Reminder)</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Meeting Offset Picker if meeting is linked */}
          {meetingId && (
            <div className="pt-2 border-t border-[#303030] flex items-center justify-between text-xs">
              <span className="text-[#737373]">Alert Timing:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "At start", mins: 0 },
                  { label: "5m before", mins: 5 },
                  { label: "10m before", mins: 10 },
                  { label: "15m before", mins: 15 },
                  { label: "30m before", mins: 30 },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.mins}
                    onClick={() => handleOffsetChange(opt.mins)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] border transition-colors",
                      offsetMinutes === opt.mins
                        ? "bg-[#262626] border-[#8B5CF6]/50 text-[#8B5CF6] font-semibold"
                        : "bg-[#202020] border-[#303030] text-[#737373] hover:text-[#F5F5F5]"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recurrence Configuration */}
        <div className="p-3 rounded-lg border border-[#303030] bg-[#181818] space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-[#303030] bg-[#202020] text-[#8B5CF6] focus:ring-[#8B5CF6]"
            />
            <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5 text-[#8B5CF6]" />
              <span>Make this a Recurring Reminder</span>
            </span>
          </label>

          {isRecurring && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#737373]">Frequency</span>
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule)}
                    className="w-full h-8 px-2 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom Interval</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#737373]">Interval (Every N)</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-8 px-2 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* Weekly days picker */}
              {recurrenceRule === "WEEKLY" && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#737373]">Repeat On Days</span>
                  <div className="flex gap-1.5">
                    {weekdays.map(({ label, day }) => {
                      const isSelected = recurrenceDaysOfWeek.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDayOfWeek(day)}
                          className={cn(
                            "h-7 w-7 rounded-md text-xs font-medium border transition-colors",
                            isSelected
                              ? "bg-[#262626] border-[#8B5CF6] text-[#8B5CF6] font-bold"
                              : "bg-[#202020] border-[#303030] text-[#737373] hover:text-[#F5F5F5]"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* End date */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#737373]">Repeat Until (Optional)</span>
                <input
                  type="datetime-local"
                  value={recurrenceEndAt}
                  onChange={(e) => setRecurrenceEndAt(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Missed Reminder Policy */}
        <div className="flex items-center justify-between text-xs text-[#737373] px-1">
          <span>If machine is offline when due:</span>
          <select
            value={missedPolicy}
            onChange={(e) => setMissedPolicy(e.target.value as MissedReminderPolicy)}
            className="h-7 w-48 rounded-lg border border-[#303030] bg-[#181818] px-2 text-[11px] text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
          >
            <option value="NOTIFY_IMMEDIATELY">Alert on next boot</option>
            <option value="SKIP">Skip missed occurrences</option>
          </select>
        </div>

        <div className="border-t border-[#303030] pt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            className="gap-1.5 text-xs font-medium bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{isEditing ? "Update Reminder" : "Create Reminder"}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
