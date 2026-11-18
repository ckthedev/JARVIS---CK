"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, AlertCircle } from "lucide-react";
import {
  MeetingDto,
  MeetingSection,
  MeetingFilters,
  MeetingStats,
} from "../types";
import { MeetingsNav } from "./meetings-nav";
import { MeetingsToolbar } from "./meetings-toolbar";
import { MeetingCard } from "./meeting-card";
import { MeetingDialog } from "./meeting-dialog";
import { RescheduleDialog } from "./reschedule-dialog";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";
import { MeetingDetailsModal } from "./meeting-details-modal";
import { CalendarView } from "./calendar-view";
import { Button } from "@/components/ui/button";

export function MeetingsManager() {
  const [currentSection, setCurrentSection] = useState<MeetingSection>("all");
  const [filters, setFilters] = useState<MeetingFilters>({
    sortBy: "startTime",
    sortOrder: "asc",
  });
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [meetings, setMeetings] = useState<MeetingDto[]>([]);
  const [stats, setStats] = useState<MeetingStats | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingDto | null>(null);
  const [reschedulingMeeting, setReschedulingMeeting] = useState<MeetingDto | null>(null);
  const [detailsMeeting, setDetailsMeeting] = useState<MeetingDto | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingDto | null>(null);
  const [initialDateForCreate, setInitialDateForCreate] = useState<Date | null>(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/meetings/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load meeting stats", err);
    }
  }, []);

  const detailsMeetingId = detailsMeeting?.id;

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("section", currentSection);

      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.meetingType) params.set("meetingType", filters.meetingType);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      if (filters.participant) params.set("participant", filters.participant);

      const res = await fetch(`/api/meetings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load meetings");
      const data = await res.json();
      setMeetings(data.meetings || []);

      // If details modal is open, refresh that meeting's hydrated data
      if (detailsMeetingId) {
        const updated = (data.meetings || []).find((m: MeetingDto) => m.id === detailsMeetingId);
        if (updated) setDetailsMeeting(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading meetings";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentSection, filters, detailsMeetingId]);

  useEffect(() => {
    fetchMeetings();
    fetchStats();
  }, [currentSection, filters, fetchMeetings, fetchStats]);

  // Handle section selection
  const handleSelectSection = (section: MeetingSection) => {
    setCurrentSection(section);
    if (section === "calendar") {
      setViewMode("calendar");
    } else {
      setViewMode("list");
    }
  };

  // Filter changes
  const handleFilterChange = (newFilters: Partial<MeetingFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Create or Update meeting
  const handleSaveMeeting = async (data: Record<string, unknown>) => {
    if (editingMeeting) {
      const res = await fetch(`/api/meetings/${editingMeeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update meeting");
      }
    } else {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create meeting");
      }
    }

    await fetchMeetings();
    await fetchStats();
  };

  // Reschedule
  const handleReschedule = async (id: string, startTime: string, endTime: string) => {
    const res = await fetch(`/api/meetings/${id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime, endTime }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to reschedule meeting");
    }
    await fetchMeetings();
    await fetchStats();
  };

  // Lifecycle action triggers
  const handleStartMeeting = async (id: string) => {
    const res = await fetch(`/api/meetings/${id}/start`, { method: "POST" });
    if (res.ok) {
      await fetchMeetings();
      await fetchStats();
    }
  };

  const handleCompleteMeeting = async (id: string) => {
    const res = await fetch(`/api/meetings/${id}/complete`, { method: "POST" });
    if (res.ok) {
      await fetchMeetings();
      await fetchStats();
    }
  };

  const handleNoShowMeeting = async (id: string) => {
    const res = await fetch(`/api/meetings/${id}/no-show`, { method: "POST" });
    if (res.ok) {
      await fetchMeetings();
      await fetchStats();
    }
  };

  const handleCancelMeeting = async (id: string) => {
    const res = await fetch(`/api/meetings/${id}/cancel`, { method: "POST" });
    if (res.ok) {
      await fetchMeetings();
      await fetchStats();
    }
  };

  // Delete
  const handleDeleteMeeting = async (id: string, permanent: boolean) => {
    const res = await fetch(`/api/meetings/${id}?permanent=${permanent}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (detailsMeeting?.id === id) setDetailsMeeting(null);
      await fetchMeetings();
      await fetchStats();
    }
  };

  // Open create dialog with preset date (from calendar slot click)
  const handleOpenCreateWithDate = (date: Date) => {
    setInitialDateForCreate(date);
    setCreateDialogOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#080D16]">
      {/* Sidebar Nav */}
      <MeetingsNav
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        onOpenCreate={() => {
          setEditingMeeting(null);
          setInitialDateForCreate(null);
          setCreateDialogOpen(true);
        }}
        stats={stats}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <MeetingsToolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* View Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {viewMode === "calendar" ? (
            <CalendarView
              meetings={meetings}
              onOpenDetails={(m) => setDetailsMeeting(m)}
              onOpenCreateWithDate={handleOpenCreateWithDate}
            />
          ) : (
            <div className="p-5">
              {loading && meetings.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-44 rounded-xl bg-card/20 border border-border/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
                  <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    No meetings found
                  </h3>
                  <p className="text-xs text-secondary-text mb-4">
                    {filters.search
                      ? "No meetings matched your search criteria."
                      : `You have no ${currentSection !== "all" ? currentSection : ""} meetings scheduled.`}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingMeeting(null);
                      setInitialDateForCreate(null);
                      setCreateDialogOpen(true);
                    }}
                    className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Schedule Meeting</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {meetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onOpenDetails={(m) => setDetailsMeeting(m)}
                      onEdit={(m) => {
                        setEditingMeeting(m);
                        setCreateDialogOpen(true);
                      }}
                      onReschedule={(m) => setReschedulingMeeting(m)}
                      onStart={handleStartMeeting}
                      onComplete={handleCompleteMeeting}
                      onNoShow={handleNoShowMeeting}
                      onCancel={handleCancelMeeting}
                      onDelete={(m) => setDeletingMeeting(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <MeetingDialog
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingMeeting(null);
          setInitialDateForCreate(null);
        }}
        onSave={handleSaveMeeting}
        initialMeeting={editingMeeting}
        initialDate={initialDateForCreate}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        meeting={reschedulingMeeting}
        isOpen={Boolean(reschedulingMeeting)}
        onClose={() => setReschedulingMeeting(null)}
        onReschedule={handleReschedule}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMeetingDialog
        meeting={deletingMeeting}
        isOpen={Boolean(deletingMeeting)}
        onClose={() => setDeletingMeeting(null)}
        onConfirm={handleDeleteMeeting}
      />

      {/* Full Meeting Details / Workspace Modal */}
      <MeetingDetailsModal
        meeting={detailsMeeting}
        isOpen={Boolean(detailsMeeting)}
        onClose={() => setDetailsMeeting(null)}
        onRefresh={fetchMeetings}
        onEdit={(m) => {
          setEditingMeeting(m);
          setCreateDialogOpen(true);
        }}
        onReschedule={(m) => setReschedulingMeeting(m)}
        onStart={handleStartMeeting}
        onComplete={handleCompleteMeeting}
        onNoShow={handleNoShowMeeting}
        onCancel={handleCancelMeeting}
      />
    </div>
  );
}
