"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Clock,
  Repeat,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ReminderDto } from "@/modules/reminders/types";

interface DashboardUpcomingRemindersProps {
  initialReminders: ReminderDto[];
}

export function DashboardUpcomingReminders({
  initialReminders,
}: DashboardUpcomingRemindersProps) {
  const [reminders, setReminders] = useState<ReminderDto[]>(initialReminders);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = async (reminderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (completingId) return;

    setCompletingId(reminderId);
    const previous = [...reminders];
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));

    try {
      const res = await fetch(`/api/reminders/${reminderId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to complete reminder");
      }
    } catch (err) {
      console.error(err);
      setReminders(previous);
    } finally {
      setCompletingId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="rounded bg-[#2A1818] border border-[#4A2020] px-1.5 py-0.2 text-[9px] font-medium text-[#EF4444]">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="rounded bg-[#282828] border border-[#383838] px-1.5 py-0.2 text-[9px] font-medium text-[#F5F5F5]">
            HIGH
          </span>
        );
      case "NORMAL":
      default:
        return (
          <span className="rounded bg-[#222222] border border-[#303030] px-1.5 py-0.2 text-[9px] font-medium text-[#A3A3A3]">
            NORMAL
          </span>
        );
    }
  };

  const formatDueDisplay = (dueAtInput: Date | string) => {
    const due = new Date(dueAtInput);
    const now = new Date();
    const isOverdue = due < now;

    const timeStr = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(due);

    const isToday = due.toISOString().split("T")[0] === now.toISOString().split("T")[0];

    if (isOverdue) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-[#EF4444]">
          <AlertCircle className="h-3 w-3 text-[#EF4444]" />
          Overdue ({timeStr})
        </span>
      );
    }

    if (isToday) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-[#D4D4D4]">
          <Clock className="h-3 w-3 text-[#737373]" />
          Today at {timeStr}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-[11px] text-[#737373]">
        <Clock className="h-3 w-3 text-[#737373]" />
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(due)}{" "}
        at {timeStr}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-[#292929] bg-[#202020] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#292929]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#A3A3A3]" />
          <h2 className="text-base font-semibold text-[#F5F5F5]">
            Upcoming Reminders
          </h2>
          <span className="rounded-full bg-[#181818] border border-[#292929] px-2 py-0.5 text-xs text-[#737373] font-medium">
            {reminders.length}
          </span>
        </div>

        <Link
          href="/reminders"
          className="flex items-center gap-1 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Reminders list */}
      <div className="mt-3.5 space-y-2">
        {reminders.length === 0 ? (
          <div className="rounded-lg bg-[#181818]/40 py-6 px-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-[#555555] mb-2" />
            <p className="text-xs font-medium text-[#F5F5F5]">
              No upcoming reminders
            </p>
            <p className="text-[11px] text-[#737373] mt-1 max-w-xs mx-auto">
              You are completely caught up on scheduled alerts.
            </p>
          </div>
        ) : (
          reminders.slice(0, 5).map((reminder) => (
            <div
              key={reminder.id}
              className="group flex items-center justify-between gap-3 rounded-lg border border-[#292929] bg-[#181818] p-3 transition-all hover:bg-[#242424] hover:border-[#383838]"
            >
              {/* Left: Complete Checkbox + Title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => handleComplete(reminder.id, e)}
                  disabled={completingId === reminder.id}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#3A3A3A] bg-[#202020] hover:border-[#737373] hover:bg-[#282828] transition-colors"
                  title="Mark reminder completed"
                >
                  <Check className="h-3 w-3 text-transparent hover:text-[#F5F5F5] transition-colors" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium text-[#F5F5F5]">
                      {reminder.title}
                    </span>
                    {reminder.isRecurring && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-[#262626] border border-[#383838] px-1 py-0.2 text-[9px] font-medium text-[#A3A3A3]"
                        title={`Repeats ${reminder.recurrenceRule || "recurring"}`}
                      >
                        <Repeat className="h-2.5 w-2.5 text-[#737373]" />
                        {reminder.recurrenceRule || "Repeat"}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5">{formatDueDisplay(reminder.dueAt)}</div>
                </div>
              </div>

              {/* Right: Priority */}
              <div className="shrink-0">{getPriorityBadge(reminder.priority)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
