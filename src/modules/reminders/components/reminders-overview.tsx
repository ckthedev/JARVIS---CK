"use client";

import React from "react";
import {
  Bell,
  Sun,
  Calendar,
  AlertTriangle,
  Repeat,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { ReminderDto, ReminderStats } from "../types";
import { MetricCard } from "@/components/dark-workspace";
import { Button } from "@/components/ui/button";

interface RemindersOverviewProps {
  reminders: ReminderDto[];
  stats?: ReminderStats;
  onOpenCreate: () => void;
  onOpenSnooze: (reminder: ReminderDto) => void;
  onComplete: (id: string) => Promise<void>;
  onEdit: (reminder: ReminderDto) => void;
  onViewSection: (section: "today" | "upcoming" | "overdue" | "recurring") => void;
}

export function RemindersOverview({
  reminders,
  stats,
  onOpenCreate,
  onOpenSnooze,
  onComplete,
  onEdit,
  onViewSection,
}: RemindersOverviewProps) {
  const now = new Date();

  // Overdue reminders
  const overdueReminders = reminders
    .filter((r) => {
      const due = new Date(r.dueAt);
      return (
        (r.status === "PENDING" || r.status === "SNOOZED") &&
        due.getTime() < now.getTime()
      );
    })
    .slice(0, 4);

  // Today's reminders
  const todayReminders = reminders.filter((r) => {
    return isToday(new Date(r.dueAt)) && r.status !== "COMPLETED" && r.status !== "CANCELLED";
  });

  // Recurring reminders
  const recurringReminders = reminders
    .filter((r) => r.isRecurring && r.status !== "COMPLETED" && r.status !== "CANCELLED")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Total Reminders"
          value={stats?.total ?? reminders.length}
          subtext="Active alerts"
          icon={Bell}
          iconColor="#8B5CF6"
          accentColor="#8B5CF6"
        />
        <MetricCard
          title="Due Today"
          value={stats?.today ?? todayReminders.length}
          subtext="Expiring today"
          icon={Sun}
          iconColor="#F59E0B"
          accentColor="#F59E0B"
        />
        <MetricCard
          title="Upcoming"
          value={stats?.upcoming ?? 0}
          subtext="Future scheduled"
          icon={Calendar}
          iconColor="#3B82F6"
          accentColor="#3B82F6"
        />
        <MetricCard
          title="Overdue"
          value={stats?.overdue ?? overdueReminders.length}
          subtext="Require resolution"
          icon={AlertTriangle}
          iconColor="#EF4444"
          accentColor="#EF4444"
        />
        <MetricCard
          title="Recurring"
          value={stats?.recurring ?? recurringReminders.length}
          subtext="Automated repeats"
          icon={Repeat}
          iconColor="#8B5CF6"
          accentColor="#8B5CF6"
        />
        <MetricCard
          title="Completed"
          value={stats?.completed ?? 0}
          subtext="Resolved alerts"
          icon={CheckCircle2}
          iconColor="#10B981"
          accentColor="#10B981"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overdue alerts & Today's schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Alerts Priority Panel */}
          {overdueReminders.length > 0 && (
            <div className="rounded-xl bg-[#202020] border border-red-500/30 p-5">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <h3 className="font-semibold text-sm text-[#F5F5F5]">
                    Overdue Attention Needed
                  </h3>
                </div>
                <button
                  onClick={() => onViewSection("overdue")}
                  className="text-xs text-red-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>View all ({stats?.overdue ?? overdueReminders.length})</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-2">
                {overdueReminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#181818] border border-red-500/20 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-[#F5F5F5] truncate">
                          {r.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          {r.priority}
                        </span>
                      </div>
                      <span className="text-[11px] text-red-400/80">
                        Due: {format(new Date(r.dueAt), "MMM d, h:mm a")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenSnooze(r)}
                        className="h-7 text-xs border-[#303030] bg-[#202020] hover:bg-[#2C2C2C] text-[#A3A3A3]"
                      >
                        Snooze
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onComplete(r.id)}
                        className="h-7 text-xs bg-[#22C55E] hover:bg-[#16A34A] text-black font-semibold"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Schedule Card */}
          <div className="rounded-xl bg-[#202020] border border-[#303030] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-[#F5F5F5]">
                  Today&apos;s Alert Timeline
                </h3>
              </div>
              <button
                onClick={() => onViewSection("today")}
                className="text-xs text-[#8B5CF6] hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>View all ({todayReminders.length})</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {todayReminders.length === 0 ? (
              <div className="py-8 text-center bg-[#181818] rounded-lg border border-[#303030]/60">
                <p className="text-xs text-[#A3A3A3]">
                  No reminders scheduled for today. Everything is on schedule.
                </p>
                <button
                  onClick={onOpenCreate}
                  className="mt-2 text-xs text-[#8B5CF6] hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add a reminder
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayReminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#181818] hover:bg-[#262626] border border-[#303030] text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => onComplete(r.id)}
                        title="Mark completed"
                        className="h-4.5 w-4.5 rounded-full border border-[#737373] hover:border-[#22C55E] flex items-center justify-center shrink-0 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-transparent hover:text-[#22C55E]" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-[#F5F5F5] truncate">
                            {r.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded border bg-[#202020] border-[#303030] text-[#A3A3A3]">
                            {r.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#737373]">
                          <Clock className="h-3 w-3 text-[#8B5CF6]" />
                          <span>{format(new Date(r.dueAt), "h:mm a")}</span>
                          {r.task && <span className="text-blue-400">• Task: {r.task.title}</span>}
                          {r.meeting && <span className="text-emerald-400">• Meeting: {r.meeting.title}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-3 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenSnooze(r)}
                        className="h-7 text-xs border-[#303030] bg-[#202020] hover:bg-[#262626] text-[#A3A3A3]"
                      >
                        Snooze
                      </Button>
                      <button
                        onClick={() => onEdit(r)}
                        className="text-xs text-[#737373] hover:text-[#F5F5F5] px-2"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recurring Overview & Shortcuts */}
        <div className="space-y-6">
          {/* Recurring Schedule Card */}
          <div className="rounded-xl bg-[#202020] border border-[#303030] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-[#8B5CF6]" />
                <h3 className="font-semibold text-sm text-[#F5F5F5]">
                  Active Recurrence Rules
                </h3>
              </div>
              <button
                onClick={() => onViewSection("recurring")}
                className="text-xs text-[#8B5CF6] hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recurringReminders.length === 0 ? (
              <div className="py-8 text-center bg-[#181818] rounded-lg border border-[#303030]/60">
                <p className="text-xs text-[#737373]">
                  No recurring reminders configured yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringReminders.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onEdit(r)}
                    className="p-2.5 rounded-lg bg-[#181818] hover:bg-[#262626] border border-[#303030] cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[#F5F5F5] truncate">
                        {r.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30 capitalize">
                        {r.recurrenceRule?.toLowerCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#737373] flex items-center gap-1.5">
                      <Clock className="h-2.5 w-2.5" />
                      <span>Next: {format(new Date(r.dueAt), "EEE, MMM d • h:mm a")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts Card */}
          <div className="rounded-xl bg-[#202020] border border-[#303030] p-5">
            <h3 className="font-semibold text-sm text-[#F5F5F5] mb-3">
              Reminder Shortcuts
            </h3>
            <div className="space-y-2">
              <Button
                onClick={onOpenCreate}
                className="w-full justify-start gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Reminder</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onViewSection("today")}
                className="w-full justify-start gap-2 bg-[#181818] border-[#303030] text-[#F5F5F5] hover:bg-[#262626] text-xs"
              >
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>View Today&apos;s Timeline</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onViewSection("recurring")}
                className="w-full justify-start gap-2 bg-[#181818] border-[#303030] text-[#F5F5F5] hover:bg-[#262626] text-xs"
              >
                <Repeat className="h-3.5 w-3.5 text-[#8B5CF6]" />
                <span>Manage Recurring Alerts</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
