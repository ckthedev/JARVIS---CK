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
  Flame,
} from "lucide-react";
import { ReminderDto } from "../types";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div
      className={cn(
        "group relative flex items-start justify-between gap-3 p-4 rounded-xl border transition-all",
        isCompleted
          ? "bg-card/40 border-border/40 opacity-70"
          : isCancelled
          ? "bg-card/30 border-border/40 opacity-60"
          : isOverdue
          ? "bg-red-950/10 border-red-500/40 hover:border-red-500/60"
          : "bg-card border-border/80 hover:border-primary/50"
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
            "mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-black"
              : "border-secondary-text hover:border-primary text-transparent hover:text-primary/40"
          )}
        >
          <CheckCircle2 className="h-4 w-4 fill-current" />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Header line: Title & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={cn(
                "text-sm font-semibold truncate",
                isCompleted
                  ? "line-through text-secondary-text"
                  : isCancelled
                  ? "line-through text-secondary-text"
                  : "text-foreground"
              )}
            >
              {reminder.title}
            </h4>

            {/* Priority Badge */}
            <Badge
              variant={
                reminder.priority === "CRITICAL"
                  ? "destructive"
                  : reminder.priority === "HIGH"
                  ? "warning"
                  : reminder.priority === "LOW"
                  ? "outline"
                  : "default"
              }
              className="text-[10px] uppercase font-semibold tracking-wider h-5 px-1.5"
            >
              {reminder.priority === "CRITICAL" && (
                <Flame className="h-3 w-3 mr-0.5 inline" />
              )}
              {reminder.priority}
            </Badge>

            {/* Status pill if snoozed / cancelled */}
            {isSnoozed && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-1">
                <Clock className="h-3 w-3" />
                Snoozed ({reminder.snoozeCount})
              </Badge>
            )}

            {isCancelled && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-secondary-text">
                Cancelled
              </Badge>
            )}

            {/* Recurrence Badge */}
            {recurrenceText && (
              <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
                <Repeat className="h-2.5 w-2.5" />
                {recurrenceText}
              </span>
            )}
          </div>

          {/* Description */}
          {reminder.description && (
            <p className="text-xs text-secondary-text line-clamp-2">
              {reminder.description}
            </p>
          )}

          {/* Meta line: Due time, overdue warning, links */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-text pt-0.5">
            {/* Due date info */}
            <div
              className={cn(
                "flex items-center gap-1 text-[11px]",
                isOverdue
                  ? "text-red-400 font-semibold"
                  : "text-secondary-text"
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3 text-primary" />
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
              <span className="inline-flex items-center gap-1 text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                <Link2 className="h-2.5 w-2.5" />
                Task: {reminder.task.title}
              </span>
            )}

            {/* Linked Meeting badge */}
            {reminder.meeting && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <Calendar className="h-2.5 w-2.5" />
                Meeting: {reminder.meeting.title}
                {reminder.offsetMinutes !== null && reminder.offsetMinutes !== undefined && (
                  <span className="text-[10px] text-secondary-text">
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
            className="h-8 px-2 text-xs border-border/80 bg-sidebar text-secondary-text hover:text-foreground hover:border-primary/40 gap-1"
          >
            <Clock className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline">Snooze</span>
          </Button>
        )}

        {/* Dropdown Menu Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMenuOpen((o) => !o)}
          className="h-8 w-8 p-0 text-secondary-text hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {/* Dropdown Menu Popup */}
        {menuOpen && (
          <div className="absolute right-0 top-9 z-30 w-44 rounded-md border border-border bg-[#111B2B] py-1 shadow-xl text-xs space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit(reminder);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-card-hover text-secondary-text hover:text-foreground text-left"
            >
              <Edit2 className="h-3.5 w-3.5 text-primary" />
              Edit Reminder
            </button>

            {!isCompleted && !isCancelled && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSnooze(reminder);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-card-hover text-secondary-text hover:text-foreground text-left"
              >
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Snooze Alert
              </button>
            )}

            {isCompleted ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onReactivate(reminder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-card-hover text-emerald-400 text-left"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reactivate
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onComplete(reminder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-card-hover text-emerald-400 text-left"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Completed
              </button>
            )}

            {!isCancelled && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onCancel(reminder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-card-hover text-secondary-text hover:text-foreground text-left"
              >
                <XCircle className="h-3.5 w-3.5 text-secondary-text" />
                Cancel Reminder
              </button>
            )}

            <div className="border-t border-border/60 my-1" />

            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete(reminder);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-red-400 text-left"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
