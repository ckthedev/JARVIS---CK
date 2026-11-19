"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RemindersNav } from "./reminders-nav";
import { RemindersToolbar } from "./reminders-toolbar";
import { ReminderCard } from "./reminder-card";
import { RemindersOverview } from "./reminders-overview";
import { ReminderDialog } from "./reminder-dialog";
import { SnoozeDialog } from "./snooze-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { EmptyState } from "@/components/dark-workspace";
import {
  ReminderDto,
  ReminderSection,
  ReminderStats,
  ReminderPriority,
  ReminderStatus,
} from "../types";
import { CreateReminderInput } from "@/lib/validations/reminder";
import { Bell } from "lucide-react";

export function RemindersManager() {
  const [section, setSection] = useState<ReminderSection>("overview");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<ReminderPriority | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | "ALL">("ALL");
  const [recurrenceFilter, setRecurrenceFilter] = useState<"ALL" | "RECURRING" | "ONE_TIME">("ALL");
  const [sortBy, setSortBy] = useState<"dueAt" | "priority" | "createdAt" | "title">("dueAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"timeline" | "flat">("timeline");

  const [reminders, setReminders] = useState<ReminderDto[]>([]);
  const [stats, setStats] = useState<ReminderStats | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderDto | null>(null);
  const [snoozeReminder, setSnoozeReminder] = useState<ReminderDto | null>(null);
  const [deleteReminder, setDeleteReminder] = useState<ReminderDto | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch reminder stats:", err);
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // If overview, query 'all' so overview computes with the full set
      params.set("section", section === "overview" ? "all" : section);
      if (search.trim()) params.set("search", search.trim());
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (recurrenceFilter === "RECURRING") params.set("isRecurring", "true");
      if (recurrenceFilter === "ONE_TIME") params.set("isRecurring", "false");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/reminders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
      }
    } catch (err) {
      console.error("Failed to load reminders:", err);
    } finally {
      setLoading(false);
    }
  }, [section, search, priorityFilter, statusFilter, recurrenceFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchReminders();
    fetchStats();
  }, [fetchReminders, fetchStats]);

  // Periodic polling for due reminders (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetch("/api/reminders/process", { method: "POST" })
        .then(() => {
          fetchReminders();
          fetchStats();
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchReminders, fetchStats]);

  // Actions
  const handleSaveReminder = async (data: CreateReminderInput) => {
    if (editingReminder) {
      const res = await fetch(`/api/reminders/${editingReminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update reminder");
      }
    } else {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create reminder");
      }
    }
    fetchReminders();
    fetchStats();
  };

  const handleComplete = async (id: string) => {
    const res = await fetch(`/api/reminders/${id}/complete`, { method: "POST" });
    if (res.ok) {
      fetchReminders();
      fetchStats();
    }
  };

  const handleReactivate = async (id: string) => {
    const res = await fetch(`/api/reminders/${id}/reactivate`, { method: "POST" });
    if (res.ok) {
      fetchReminders();
      fetchStats();
    }
  };

  const handleCancel = async (id: string) => {
    const res = await fetch(`/api/reminders/${id}/cancel`, { method: "POST" });
    if (res.ok) {
      fetchReminders();
      fetchStats();
    }
  };

  const handleSnooze = async (id: string, durationMinutes?: number, customDate?: string) => {
    const res = await fetch(`/api/reminders/${id}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes, customDate }),
    });
    if (res.ok) {
      fetchReminders();
      fetchStats();
    }
  };

  const handleDelete = async (id: string, permanent: boolean) => {
    const res = await fetch(`/api/reminders/${id}?permanent=${permanent}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchReminders();
      fetchStats();
    }
  };

  // Grouping logic for Timeline view
  const groupedReminders = useMemo(() => {
    if (viewMode === "flat") return null;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const groups: {
      overdue: ReminderDto[];
      today: ReminderDto[];
      tomorrow: ReminderDto[];
      thisWeek: ReminderDto[];
      later: ReminderDto[];
      completedOrCancelled: ReminderDto[];
    } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      completedOrCancelled: [],
    };

    reminders.forEach((r) => {
      if (r.status === "COMPLETED" || r.status === "CANCELLED") {
        groups.completedOrCancelled.push(r);
        return;
      }
      const due = new Date(r.dueAt);
      if (due.getTime() < now.getTime()) {
        groups.overdue.push(r);
      } else if (due.getTime() >= todayStart.getTime() && due.getTime() < tomorrowStart.getTime()) {
        groups.today.push(r);
      } else if (due.getTime() >= tomorrowStart.getTime() && due.getTime() < dayAfterTomorrow.getTime()) {
        groups.tomorrow.push(r);
      } else if (due.getTime() >= dayAfterTomorrow.getTime() && due.getTime() < weekEnd.getTime()) {
        groups.thisWeek.push(r);
      } else {
        groups.later.push(r);
      }
    });

    return groups;
  }, [reminders, viewMode]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Navigation Sidebar */}
      <RemindersNav
        currentSection={section}
        onSelectSection={(sec) => setSection(sec)}
        onOpenCreate={() => {
          setEditingReminder(null);
          setIsDialogOpen(true);
        }}
        stats={stats}
      />

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 min-w-0">
        {section === "overview" ? (
          <RemindersOverview
            reminders={reminders}
            stats={stats}
            onOpenCreate={() => {
              setEditingReminder(null);
              setIsDialogOpen(true);
            }}
            onOpenSnooze={(r) => setSnoozeReminder(r)}
            onComplete={handleComplete}
            onEdit={(r) => {
              setEditingReminder(r);
              setIsDialogOpen(true);
            }}
            onViewSection={(sec) => setSection(sec)}
          />
        ) : (
          <>
            <RemindersToolbar
              search={search}
              onSearchChange={setSearch}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              recurrenceFilter={recurrenceFilter}
              onRecurrenceChange={setRecurrenceFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onToggleSortOrder={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onRefresh={() => {
                fetchReminders();
                fetchStats();
              }}
              loading={loading}
            />

            {/* Reminders List */}
            {reminders.length === 0 ? (
              <div className="p-8 rounded-xl border border-[#303030] bg-[#141414]">
                <EmptyState
                  icon={Bell}
                  title={`No ${section !== "all" ? section : ""} reminders found`}
                  description={
                    search
                      ? "No reminders matched your search criteria. Try modifying your filter terms."
                      : section === "completed"
                      ? "No completed reminders in the archive."
                      : section === "overdue"
                      ? "All alerts are fully on track! Zero overdue items."
                      : "Create reminders with custom frequencies, priority levels, and automatic notification delivery."
                  }
                  action={{
                    label: "Add First Reminder",
                    onClick: () => {
                      setEditingReminder(null);
                      setIsDialogOpen(true);
                    },
                  }}
                />
              </div>
            ) : viewMode === "flat" ? (
              <div className="space-y-2.5">
                {reminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onComplete={handleComplete}
                    onReactivate={handleReactivate}
                    onCancel={handleCancel}
                    onEdit={(r) => {
                      setEditingReminder(r);
                      setIsDialogOpen(true);
                    }}
                    onOpenSnooze={(r) => setSnoozeReminder(r)}
                    onDelete={(r) => setDeleteReminder(r)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overdue Section */}
                {groupedReminders?.overdue && groupedReminders.overdue.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
                      <span>Overdue ({groupedReminders.overdue.length})</span>
                    </div>
                    {groupedReminders.overdue.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={handleComplete}
                        onReactivate={handleReactivate}
                        onCancel={handleCancel}
                        onEdit={(r) => {
                          setEditingReminder(r);
                          setIsDialogOpen(true);
                        }}
                        onOpenSnooze={(r) => setSnoozeReminder(r)}
                        onDelete={(r) => setDeleteReminder(r)}
                      />
                    ))}
                  </div>
                )}

                {/* Today Section */}
                {groupedReminders?.today && groupedReminders.today.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      <span>Today ({groupedReminders.today.length})</span>
                    </div>
                    {groupedReminders.today.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={handleComplete}
                        onReactivate={handleReactivate}
                        onCancel={handleCancel}
                        onEdit={(r) => {
                          setEditingReminder(r);
                          setIsDialogOpen(true);
                        }}
                        onOpenSnooze={(r) => setSnoozeReminder(r)}
                        onDelete={(r) => setDeleteReminder(r)}
                      />
                    ))}
                  </div>
                )}

                {/* Tomorrow Section */}
                {groupedReminders?.tomorrow && groupedReminders.tomorrow.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      <span>Tomorrow ({groupedReminders.tomorrow.length})</span>
                    </div>
                    {groupedReminders.tomorrow.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={handleComplete}
                        onReactivate={handleReactivate}
                        onCancel={handleCancel}
                        onEdit={(r) => {
                          setEditingReminder(r);
                          setIsDialogOpen(true);
                        }}
                        onOpenSnooze={(r) => setSnoozeReminder(r)}
                        onDelete={(r) => setDeleteReminder(r)}
                      />
                    ))}
                  </div>
                )}

                {/* This Week Section */}
                {groupedReminders?.thisWeek && groupedReminders.thisWeek.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">
                      <span>This Week ({groupedReminders.thisWeek.length})</span>
                    </div>
                    {groupedReminders.thisWeek.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={handleComplete}
                        onReactivate={handleReactivate}
                        onCancel={handleCancel}
                        onEdit={(r) => {
                          setEditingReminder(r);
                          setIsDialogOpen(true);
                        }}
                        onOpenSnooze={(r) => setSnoozeReminder(r)}
                        onDelete={(r) => setDeleteReminder(r)}
                      />
                    ))}
                  </div>
                )}

                {/* Later Section */}
                {groupedReminders?.later && groupedReminders.later.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#737373] uppercase tracking-wider">
                      <span>Later ({groupedReminders.later.length})</span>
                    </div>
                    {groupedReminders.later.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={handleComplete}
                        onReactivate={handleReactivate}
                        onCancel={handleCancel}
                        onEdit={(r) => {
                          setEditingReminder(r);
                          setIsDialogOpen(true);
                        }}
                        onOpenSnooze={(r) => setSnoozeReminder(r)}
                        onDelete={(r) => setDeleteReminder(r)}
                      />
                    ))}
                  </div>
                )}

                {/* Completed or Cancelled Section */}
                {groupedReminders?.completedOrCancelled && groupedReminders.completedOrCancelled.length > 0 && (
                  <div className="space-y-2.5 pt-4 border-t border-[#303030]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#737373] uppercase tracking-wider">
                      <span>Completed / Inactive ({groupedReminders.completedOrCancelled.length})</span>
                    </div>
                    {groupedReminders.completedOrCancelled.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={handleComplete}
                        onReactivate={handleReactivate}
                        onCancel={handleCancel}
                        onEdit={(r) => {
                          setEditingReminder(r);
                          setIsDialogOpen(true);
                        }}
                        onOpenSnooze={(r) => setSnoozeReminder(r)}
                        onDelete={(r) => setDeleteReminder(r)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <ReminderDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingReminder(null);
        }}
        reminder={editingReminder}
        onSave={handleSaveReminder}
        defaultSection={section}
      />

      <SnoozeDialog
        reminder={snoozeReminder}
        isOpen={Boolean(snoozeReminder)}
        onClose={() => setSnoozeReminder(null)}
        onSnooze={handleSnooze}
      />

      <DeleteConfirmationDialog
        reminder={deleteReminder}
        isOpen={Boolean(deleteReminder)}
        onClose={() => setDeleteReminder(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
