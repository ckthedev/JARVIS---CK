"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Video,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Users,
  ListTodo,
  Bell,
  Paperclip,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MeetingDto,
  MeetingType,
  MeetingPriority,
} from "../types";
import { FileDto } from "@/modules/files/types";
import { cn } from "@/lib/utils";

interface MeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  initialMeeting?: MeetingDto | null;
  initialDate?: Date | null;
}

export function MeetingDialog({
  isOpen,
  onClose,
  onSave,
  initialMeeting,
  initialDate,
}: MeetingDialogProps) {
  const isEditing = Boolean(initialMeeting);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("10:00");
  const [endTimeStr, setEndTimeStr] = useState("11:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [meetingType, setMeetingType] = useState<MeetingType>("ONLINE");
  const [priority, setPriority] = useState<MeetingPriority>("NORMAL");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [location, setLocation] = useState("");

  // Participants
  const [attendees, setAttendees] = useState<
    { name: string; email?: string; phone?: string; organization?: string; role?: string }[]
  >([]);
  const [attName, setAttName] = useState("");
  const [attEmail, setAttEmail] = useState("");
  const [attPhone, setAttPhone] = useState("");
  const [attOrg, setAttOrg] = useState("");
  const [attRole, setAttRole] = useState("");

  // Agenda
  const [agendaItems, setAgendaItems] = useState<
    { title: string; description?: string; durationMinutes: number }[]
  >([]);
  const [agTitle, setAgTitle] = useState("");
  const [agDesc, setAgDesc] = useState("");
  const [agDuration, setAgDuration] = useState("15");

  // Reminders
  const [reminderOffsets, setReminderOffsets] = useState<number[]>([15]);

  // Attachments
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<FileDto[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"general" | "participants" | "agenda" | "reminders" | "attachments">("general");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Populate initial state
  useEffect(() => {
    if (initialMeeting) {
      setTitle(initialMeeting.title);
      setDescription(initialMeeting.description || "");
      const start = new Date(initialMeeting.startTime);
      const end = new Date(initialMeeting.endTime);
      setDateStr(format(start, "yyyy-MM-dd"));
      setStartTimeStr(format(start, "HH:mm"));
      setEndTimeStr(format(end, "HH:mm"));
      setTimezone(initialMeeting.timezone || "Asia/Kolkata");
      setMeetingType(initialMeeting.meetingType);
      setPriority(initialMeeting.priority);
      setMeetingUrl(initialMeeting.meetingUrl || "");
      setLocation(initialMeeting.location || "");

      if (initialMeeting.attendees) {
        setAttendees(
          initialMeeting.attendees.map((a) => ({
            name: a.name,
            email: a.email || undefined,
            phone: a.phone || undefined,
            organization: a.organization || undefined,
            role: a.role || undefined,
          }))
        );
      }

      if (initialMeeting.agendaItems) {
        setAgendaItems(
          initialMeeting.agendaItems.map((ag) => ({
            title: ag.title,
            description: ag.description || undefined,
            durationMinutes: ag.durationMinutes,
          }))
        );
      }

      if (initialMeeting.attachments) {
        setSelectedFileIds(initialMeeting.attachments.map((a) => a.fileId));
      }
    } else {
      // Default creation state
      setTitle("");
      setDescription("");
      const now = initialDate ? new Date(initialDate) : new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      setDateStr(format(now, "yyyy-MM-dd"));
      setStartTimeStr(format(now, "HH:mm"));
      setEndTimeStr(format(end, "HH:mm"));
      setTimezone("Asia/Kolkata");
      setMeetingType("ONLINE");
      setPriority("NORMAL");
      setMeetingUrl("");
      setLocation("");
      setAttendees([]);
      setAgendaItems([]);
      setSelectedFileIds([]);
      setReminderOffsets([15]);
    }
    setActiveTab("general");
    setError(null);
  }, [initialMeeting, initialDate, isOpen]);

  // Load available files for attachments tab
  useEffect(() => {
    if (isOpen && activeTab === "attachments") {
      setLoadingFiles(true);
      fetch("/api/files?limit=50")
        .then((res) => (res.ok ? res.json() : { files: [] }))
        .then((data) => {
          if (data.files) setAvailableFiles(data.files);
        })
        .catch(() => {})
        .finally(() => setLoadingFiles(false));
    }
  }, [isOpen, activeTab]);

  const handleAddAttendee = () => {
    if (!attName.trim()) return;
    setAttendees([
      ...attendees,
      {
        name: attName.trim(),
        email: attEmail.trim() || undefined,
        phone: attPhone.trim() || undefined,
        organization: attOrg.trim() || undefined,
        role: attRole.trim() || undefined,
      },
    ]);
    setAttName("");
    setAttEmail("");
    setAttPhone("");
    setAttOrg("");
    setAttRole("");
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleAddAgendaItem = () => {
    if (!agTitle.trim()) return;
    setAgendaItems([
      ...agendaItems,
      {
        title: agTitle.trim(),
        description: agDesc.trim() || undefined,
        durationMinutes: parseInt(agDuration, 10) || 15,
      },
    ]);
    setAgTitle("");
    setAgDesc("");
    setAgDuration("15");
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const toggleReminderOffset = (offset: number) => {
    if (reminderOffsets.includes(offset)) {
      setReminderOffsets(reminderOffsets.filter((o) => o !== offset));
    } else {
      setReminderOffsets([...reminderOffsets, offset].sort((a, b) => a - b));
    }
  };

  const toggleFileSelection = (fileId: string) => {
    if (selectedFileIds.includes(fileId)) {
      setSelectedFileIds(selectedFileIds.filter((id) => id !== fileId));
    } else {
      setSelectedFileIds([...selectedFileIds, fileId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Meeting title is required.");
      setActiveTab("general");
      return;
    }

    if (!dateStr || !startTimeStr || !endTimeStr) {
      setError("Please specify meeting date, start time, and end time.");
      setActiveTab("general");
      return;
    }

    const startIso = `${dateStr}T${startTimeStr}:00+05:30`;
    const endIso = `${dateStr}T${endTimeStr}:00+05:30`;

    const start = new Date(startIso);
    const end = new Date(endIso);

    if (end.getTime() <= start.getTime()) {
      setError("Meeting end time must be strictly after start time.");
      setActiveTab("general");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      timezone,
      meetingType,
      priority,
      meetingUrl: meetingType === "ONLINE" ? meetingUrl.trim() || null : null,
      location: meetingType !== "ONLINE" ? location.trim() || null : null,
      attendees,
      agendaItems,
      reminderOffsets,
      attachmentFileIds: selectedFileIds,
    };

    try {
      setLoading(true);
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save meeting";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Meeting" : "Schedule Meeting"}
      description={
        isEditing
          ? "Update meeting details, participants, agenda, and files."
          : "Create a new meeting with agenda, attendees, and automated reminders."
      }
      maxWidth="2xl"
      className="bg-[#141414] border-[#303030] text-[#F5F5F5]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Tab Headers */}
        <div className="flex items-center gap-1 border-b border-[#303030] pb-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-colors",
              activeTab === "general"
                ? "bg-[#262626] text-[#8B5CF6] border border-[#8B5CF6]/40"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            General Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("participants")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors",
              activeTab === "participants"
                ? "bg-[#262626] text-[#8B5CF6] border border-[#8B5CF6]/40"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Participants ({attendees.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("agenda")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors",
              activeTab === "agenda"
                ? "bg-[#262626] text-[#8B5CF6] border border-[#8B5CF6]/40"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span>Agenda ({agendaItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reminders")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors",
              activeTab === "reminders"
                ? "bg-[#262626] text-[#8B5CF6] border border-[#8B5CF6]/40"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Reminders ({reminderOffsets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attachments")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors",
              activeTab === "attachments"
                ? "bg-[#262626] text-[#8B5CF6] border border-[#8B5CF6]/40"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>Attachments ({selectedFileIds.length})</span>
          </button>
        </div>

        {/* Tab 1: General Details */}
        {activeTab === "general" && (
          <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                Meeting Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Product Sync"
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                  Meeting Type
                </label>
                <div className="flex rounded-lg bg-[#181818] border border-[#303030] p-0.5">
                  <button
                    type="button"
                    onClick={() => setMeetingType("ONLINE")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors",
                      meetingType === "ONLINE"
                        ? "bg-[#262626] text-[#8B5CF6] font-semibold"
                        : "text-[#737373] hover:text-[#F5F5F5]"
                    )}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingType("PHYSICAL")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors",
                      meetingType === "PHYSICAL"
                        ? "bg-[#262626] text-[#8B5CF6] font-semibold"
                        : "text-[#737373] hover:text-[#F5F5F5]"
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Physical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingType("PHONE")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors",
                      meetingType === "PHONE"
                        ? "bg-[#262626] text-[#8B5CF6] font-semibold"
                        : "text-[#737373] hover:text-[#F5F5F5]"
                    )}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Phone</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as MeetingPriority)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                >
                  <option value="NORMAL" className="bg-[#181818] text-[#F5F5F5]">Normal Priority</option>
                  <option value="HIGH" className="bg-[#181818] text-[#F5F5F5]">High Priority</option>
                  <option value="LOW" className="bg-[#181818] text-[#F5F5F5]">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
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
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
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

            {/* Location or Meeting URL */}
            {meetingType === "ONLINE" ? (
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                  Meeting URL (Google Meet, Zoom, MS Teams, etc.)
                </label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abc or https://zoom.us/j/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                  {meetingType === "PHYSICAL" ? "Physical Location / Address" : "Phone Number / Bridge"}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={
                    meetingType === "PHYSICAL"
                      ? "Conference Room B, HQ 4th Floor"
                      : "+91 98765 43210 (PIN: 1234)"
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of the meeting goals and context..."
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] resize-none"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Participants */}
        {activeTab === "participants" && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-lg bg-[#181818] border border-[#303030] space-y-2">
              <span className="text-xs font-semibold text-[#F5F5F5]">Add Participant</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={attName}
                  onChange={(e) => setAttName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={attEmail}
                  onChange={(e) => setAttEmail(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={attPhone}
                  onChange={(e) => setAttPhone(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Organization"
                    value={attOrg}
                    onChange={(e) => setAttOrg(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={attRole}
                    onChange={(e) => setAttRole(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttendee}
                disabled={!attName.trim()}
                className="text-xs gap-1 h-8 bg-[#202020] border-[#303030] text-[#F5F5F5] hover:bg-[#2C2C2C]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Participant</span>
              </Button>
            </div>

            {/* List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">
                Added Participants ({attendees.length})
              </span>
              {attendees.length === 0 ? (
                <p className="text-xs text-[#737373] italic py-2">
                  No participants added yet.
                </p>
              ) : (
                attendees.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#202020] border border-[#303030] text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#F5F5F5]">{a.name}</div>
                      <div className="text-[11px] text-[#737373] flex items-center gap-2">
                        {a.email && <span>{a.email}</span>}
                        {a.role && <span>• {a.role}</span>}
                        {a.organization && <span>• {a.organization}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(idx)}
                      className="text-[#737373] hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Agenda */}
        {activeTab === "agenda" && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-lg bg-[#181818] border border-[#303030] space-y-2">
              <span className="text-xs font-semibold text-[#F5F5F5]">Add Agenda Item</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Topic / Agenda Item *"
                  value={agTitle}
                  onChange={(e) => setAgTitle(e.target.value)}
                  className="md:col-span-3 px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
                <input
                  type="number"
                  min="1"
                  max="360"
                  placeholder="Minutes"
                  value={agDuration}
                  onChange={(e) => setAgDuration(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
              <input
                type="text"
                placeholder="Optional description / context"
                value={agDesc}
                onChange={(e) => setAgDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#202020] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAgendaItem}
                disabled={!agTitle.trim()}
                className="text-xs gap-1 h-8 bg-[#202020] border-[#303030] text-[#F5F5F5] hover:bg-[#2C2C2C]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Agenda Item</span>
              </Button>
            </div>

            {/* List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">
                Agenda Outline ({agendaItems.length})
              </span>
              {agendaItems.length === 0 ? (
                <p className="text-xs text-[#737373] italic py-2">
                  No agenda items defined yet.
                </p>
              ) : (
                agendaItems.map((ag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#202020] border border-[#303030] text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#F5F5F5] flex items-center gap-2">
                        <span>{idx + 1}. {ag.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#181818] text-[#A3A3A3] border border-[#303030]">
                          {ag.durationMinutes}m
                        </span>
                      </div>
                      {ag.description && (
                        <div className="text-[11px] text-[#737373] mt-0.5">
                          {ag.description}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAgendaItem(idx)}
                      className="text-[#737373] hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Reminders */}
        {activeTab === "reminders" && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-[#A3A3A3]">
              Select when you would like to receive notifications before the meeting starts:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { offset: 0, label: "At start time" },
                { offset: 5, label: "5 minutes before" },
                { offset: 10, label: "10 minutes before" },
                { offset: 15, label: "15 minutes before" },
                { offset: 30, label: "30 minutes before" },
                { offset: 60, label: "1 hour before" },
              ].map(({ offset, label }) => {
                const checked = reminderOffsets.includes(offset);
                return (
                  <label
                    key={offset}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors",
                      checked
                        ? "bg-[#262626] border-[#8B5CF6]/50 text-[#F5F5F5] font-medium"
                        : "bg-[#202020] border-[#303030] text-[#737373] hover:text-[#F5F5F5]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleReminderOffset(offset)}
                      className="rounded border-[#303030] bg-[#181818] text-[#8B5CF6] focus:ring-[#8B5CF6]"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Attachments */}
        {activeTab === "attachments" && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-[#A3A3A3]">
              Link existing documents or media from your File Manager:
            </p>
            {loadingFiles ? (
              <p className="text-xs text-[#737373]">Loading files...</p>
            ) : availableFiles.length === 0 ? (
              <p className="text-xs text-[#737373] italic">
                No files found in File Manager.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableFiles.map((file) => {
                  const selected = selectedFileIds.includes(file.id);
                  return (
                    <label
                      key={file.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer truncate transition-colors",
                        selected
                          ? "bg-[#262626] border-[#8B5CF6]/50 text-[#F5F5F5] font-medium"
                          : "bg-[#202020] border-[#303030] text-[#737373] hover:text-[#F5F5F5]"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleFileSelection(file.id)}
                        className="rounded border-[#303030] bg-[#181818] text-[#8B5CF6] focus:ring-[#8B5CF6]"
                      />
                      <Paperclip className="h-3.5 w-3.5 text-[#8B5CF6] shrink-0" />
                      <span className="truncate">{file.originalName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
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
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Meeting"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
