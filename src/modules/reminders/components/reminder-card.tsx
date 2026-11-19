"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  AlertTriangle,
  Repeat,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCcw,
  Link2,
} from "lucide-react";
import { ReminderDto } from "../types";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";

interface ReminderCardProps {
  reminder: ReminderDto;
  onComplete: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onEdit: (reminder: ReminderDto) => void;
  onOpenSnooze: (reminder: ReminderDto) => void;
  onDelete: (reminder: ReminderDto) => void;
}

export function ReminderCard({
  reminder,
  onComplete,
  onReactivate,
  onCancel,
  onEdit,
  onOpenSnooze,
  onDelete,
}: ReminderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const isCompleted = reminder.status === "COMPLETED";
  const isCancelled = reminder.status === "CANCELLED";
  const isSnoozed = reminder.status === "SNOOZED";
  const now = new Date();
  const dueDate = new Date(reminder.dueAt);
  const isOverdue =
    (reminder.status === "PENDING" || reminder.status === "SNOOZED") &&
    dueDate.getTime() < now.getTime();

  // Format Due Date
  const formattedDueDate = formatDateTime(reminder.dueAt);

  // Recurrence summary text
  const getRecurrenceText = () => {
    if (!reminder.isRecurring) return null;
    const interval = reminder.recurrenceInterval || 1;
    switch (reminder.recurrenceRule) {
      case "DAILY":
        return interval === 1 ? "Daily" : `Every ${interval} days`;
      case "WEEKLY": {
        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const days = (reminder.recurrenceDaysOfWeek || []).map((d) => daysMap[d]);
        return days.length > 0
          ? `Weekly: ${days.join(", ")}`
          : interval === 1
          ? "Weekly"
          : `Every ${interval} weeks`;
      }
      case "MONTHLY":
        return interval === 1 ? "Monthly" : `Every ${interval} months`;
      case "YEARLY":
        return interval === 1 ? "Yearly" : `Every ${interval} years`;
      default:
        return "Recurring";
    }
  };

  const recurrenceText = getRecurrenceText();

  const getPriorityBadgeClass = () => {
    switch (reminder.priority) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "LOW":
        return "bg-[#262626] text-[#737373] border-[#303030]";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200",
        isCompleted
          ? "bg-[#181818] border-[#303030] opacity-60"
          : isCancelled
          ? "bg-[#181818] border-[#303030] opacity-50"
          : isOverdue
          ? "bg-[#202020] border-red-500/40 hover:border-red-500/60"
          : "bg-[#202020] border-[#303030] hover:border-[#8B5CF6]/50"
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Completion checkbox button */}
        <button
          onClick={() =>
            isCompleted
              ? onReactivate(reminder.id)
              : onComplete(reminder.id)
          }
          title={isCompleted ? "Reactivate reminder" : "Mark as completed"}
          className={cn(
            "mt-0.5 h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-colors shrink-0",
            isCompleted
              ? "bg-[#22C55E] border-[#22C55E] text-black"
              : "border-[#737373] hover:border-[#8B5CF6] text-transparent hover:text-[#8B5CF6]/40"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Header line: Title & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={cn(
                "text-xs font-semibold truncate",
                isCompleted || isCancelled
                  ? "line-through text-[#737373]"
                  : "text-[#F5F5F5]"
              )}
            >
              {reminder.title}
            </h4>

            {/* Priority Badge */}
            <span
              className={cn(
                "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border",
                getPriorityBadgeClass()
              )}
            >
              {reminder.priority}
            </span>

            {/* Snoozed pill */}
            {isSnoozed && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-medium text-amber-400">
                <Clock className="h-2.5 w-2.5" />
                Snoozed ({reminder.snoozeCount})
              </span>
            )}

            {isCancelled && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#181818] border border-[#303030] text-[#737373]">
                Cancelled
              </span>
            )}

            {/* Recurrence Badge */}
            {recurrenceText && (
              <span className="inline-flex items-center gap-1 rounded bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 px-1.5 py-0.2 text-[10px] font-medium text-[#8B5CF6]">
                <Repeat className="h-2.5 w-2.5" />
                {recurrenceText}
              </span>
            )}
          </div>

          {/* Description */}
          {reminder.description && (
            <p className="text-xs text-[#A3A3A3] line-clamp-2">
              {reminder.description}
            </p>
          )}

          {/* Meta line: Due time, overdue warning, links */}
          <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
            {/* Due date info */}
            <div
              className={cn(
                "flex items-center gap-1 text-[11px]",
                isOverdue
                  ? "text-red-400 font-semibold"
                  : "text-[#737373]"
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3 text-[#8B5CF6]" />
              )}
              <span>
                {isOverdue ? "Overdue: " : "Due: "}
                {formattedDueDate}
              </span>
            </div>

            {/* Snoozed until notice */}
            {isSnoozed && reminder.snoozedUntil && (
              <span className="text-[11px] text-amber-400 font-medium">
                (Snoozed until {formatDateTime(reminder.snoozedUntil)})
              </span>
            )}

            {/* Linked Task badge */}
            {reminder.task && (
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                <Link2 className="h-2.5 w-2.5" />
                Task: {reminder.task.title}
              </span>
            )}

            {/* Linked Meeting badge */}
            {reminder.meeting && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                <Calendar className="h-2.5 w-2.5" />
                Meeting: {reminder.meeting.title}
                {reminder.offsetMinutes !== null && reminder.offsetMinutes !== undefined && (
                  <span className="text-[#737373]">
                    ({reminder.offsetMinutes === 0 ? "at start" : `${reminder.offsetMinutes}m before`})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 relative" ref={menuRef}>
        {!isCompleted && !isCancelled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSnooze(reminder)}
            className="h-7 px-2 text-xs border-[#303030] bg-[#181818] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#262626] gap-1"
          >
            <Clock className="h-3 w-3 text-[#8B5CF6]" />
            <span className="hidden sm:inline">Snooze</span>
          </Button>
        )}

        {/* Dropdown Menu Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMenuOpen((o) => !o)}
          className="h-7 w-7 p-0 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#262626] rounded"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>

        {/* Dropdown Menu Popup */}
        {menuOpen && (
          <div className="absolute right-0 top-8 z-30 w-44 rounded-lg border border-[#303030] bg-[#181818] py-1 shadow-xl text-xs space-y-0.5">
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit(reminder);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-[#A3A3A3] hover:text-[#F5F5F5] text-left"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#8B5CF6]" />
              <span>Edit Reminder</span>
            </button>

            {!isCompleted && !isCancelled && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSnooze(reminder);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-amber-400 text-left"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Snooze Alert</span>
              </button>
            )}

            {isCompleted ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onReactivate(reminder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-emerald-400 text-left"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reactivate</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onComplete(reminder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-emerald-400 text-left"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Completed</span>
              </button>
            )}

            {!isCancelled && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onCancel(reminder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-[#737373] hover:text-[#F5F5F5] text-left"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel Reminder</span>
              </button>
            )}

            <div className="border-t border-[#303030] my-1" />

            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete(reminder);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-400 text-left"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
