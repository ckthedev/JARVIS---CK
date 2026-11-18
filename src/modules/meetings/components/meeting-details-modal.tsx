"use client";

import React, { useState, useEffect } from "react";
import { format, differenceInMinutes } from "date-fns";
import {
  MapPin,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Users,
  ListTodo,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Save,
  CheckSquare,
  Square,
  Download,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MeetingDto,
  AttendeeStatus,
} from "../types";
import { FileDto } from "@/modules/files/types";

interface MeetingDetailsModalProps {
  meeting: MeetingDto | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onEdit: (meeting: MeetingDto) => void;
  onReschedule: (meeting: MeetingDto) => void;
  onStart: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onNoShow: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export function MeetingDetailsModal({
  meeting,
  isOpen,
  onClose,
  onRefresh,
  onEdit,
  onReschedule,
  onStart,
  onComplete,
  onNoShow,
  onCancel,
}: MeetingDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "agenda" | "participants" | "notes" | "tasks" | "attachments"
  >("agenda");

  // Attendees state
  const [newAttName, setNewAttName] = useState("");
  const [newAttEmail, setNewAttEmail] = useState("");
  const [newAttRole, setNewAttRole] = useState("");

  // Agenda state
  const [newAgTitle, setNewAgTitle] = useState("");
  const [newAgDuration, setNewAgDuration] = useState("15");

  // Notes state
  const [discussionSummary, setDiscussionSummary] = useState("");
  const [keyDecisions, setKeyDecisions] = useState("");
  const [importantPoints, setImportantPoints] = useState("");
  const [followUpInfo, setFollowUpInfo] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // Tasks state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"CRITICAL" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [creatingTask, setCreatingTask] = useState(false);

  // Attachments state
  const [availableFiles, setAvailableFiles] = useState<FileDto[]>([]);
  const [selectedFileToAttach, setSelectedFileToAttach] = useState("");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (meeting) {
      const primaryNoteLink = meeting.notes && meeting.notes.length > 0 ? meeting.notes[0] : null;
      setDiscussionSummary(primaryNoteLink?.discussionSummary || "");
      setKeyDecisions(primaryNoteLink?.keyDecisions || "");
      setImportantPoints(primaryNoteLink?.importantPoints || "");
      setFollowUpInfo(primaryNoteLink?.followUpInfo || "");
      setNoteContent(primaryNoteLink?.note?.content || "");
    }
  }, [meeting]);

  useEffect(() => {
    if (isOpen && activeTab === "attachments") {
      fetch("/api/files?limit=50")
        .then((res) => (res.ok ? res.json() : { files: [] }))
        .then((data) => {
          if (data.files) setAvailableFiles(data.files);
        })
        .catch(() => {});
    }
  }, [isOpen, activeTab]);

  if (!meeting) return null;

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const durationMins = Math.max(1, differenceInMinutes(endTime, startTime));

  const copyAddress = () => {
    if (meeting.location) {
      navigator.clipboard.writeText(meeting.location);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Agenda operations
  const handleToggleAgendaItem = async (itemId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/meetings/${meeting.id}/agenda`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isCompleted: !currentStatus }),
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAgendaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgTitle.trim()) return;
    try {
      await fetch(`/api/meetings/${meeting.id}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAgTitle.trim(),
          durationMinutes: parseInt(newAgDuration, 10) || 15,
        }),
      });
      setNewAgTitle("");
      setNewAgDuration("15");
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAgendaItem = async (itemId: string) => {
    try {
      await fetch(`/api/meetings/${meeting.id}/agenda?itemId=${itemId}`, {
        method: "DELETE",
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveAgenda = async (index: number, direction: "up" | "down") => {
    if (!meeting.agendaItems) return;
    const items = [...meeting.agendaItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    try {
      await fetch(`/api/meetings/${meeting.id}/agenda`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: items.map((i) => i.id) }),
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Attendee operations
  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttName.trim()) return;
    try {
      await fetch(`/api/meetings/${meeting.id}/attendees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAttName.trim(),
          email: newAttEmail.trim() || undefined,
          role: newAttRole.trim() || undefined,
        }),
      });
      setNewAttName("");
      setNewAttEmail("");
      setNewAttRole("");
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAttendeeStatus = async (attendeeId: string, status: AttendeeStatus) => {
    try {
      await fetch(`/api/meetings/${meeting.id}/attendees`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId, status }),
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAttendee = async (attendeeId: string) => {
    try {
      await fetch(`/api/meetings/${meeting.id}/attendees?attendeeId=${attendeeId}`, {
        method: "DELETE",
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Notes operations
  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const existingLink = meeting.notes && meeting.notes.length > 0 ? meeting.notes[0] : null;
      await fetch(`/api/meetings/${meeting.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: existingLink?.noteId,
          content: noteContent,
          discussionSummary,
          keyDecisions,
          importantPoints,
          followUpInfo,
        }),
      });
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 2500);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Follow-up Tasks
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      setCreatingTask(true);
      await fetch(`/api/meetings/${meeting.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          priority: taskPriority,
          dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        }),
      });
      setTaskTitle("");
      setTaskDueDate("");
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Attachments
  const handleAttachFile = async () => {
    if (!selectedFileToAttach) return;
    try {
      await fetch(`/api/meetings/${meeting.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: selectedFileToAttach }),
      });
      setSelectedFileToAttach("");
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDetachFile = async (fileId: string) => {
    try {
      await fetch(`/api/meetings/${meeting.id}/attachments?fileId=${fileId}`, {
        method: "DELETE",
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      className="p-0 overflow-hidden"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Workspace Header */}
        <div className="p-5 border-b border-border/60 bg-[#0B1220]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                {meeting.status}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-secondary/80 text-foreground/90 border border-border/60">
                {meeting.meetingType}
              </span>
              {meeting.priority === "HIGH" && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  HIGH PRIORITY
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {meeting.meetingType === "ONLINE" && meeting.meetingUrl && (
                <a
                  href={meeting.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Join Call</span>
                </a>
              )}

              {meeting.status !== "IN_PROGRESS" && meeting.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStart(meeting.id)}
                  className="h-8 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>Start</span>
                </Button>
              )}

              {meeting.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onComplete(meeting.id)}
                  className="h-8 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10 gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Complete</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onReschedule(meeting)}
                className="h-8 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Reschedule</span>
              </Button>

              {meeting.status !== "NO_SHOW" && meeting.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNoShow(meeting.id)}
                  className="h-8 text-xs text-purple-400 border-purple-500/30 hover:bg-purple-500/10 gap-1.5"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>No-Show</span>
                </Button>
              )}

              {meeting.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(meeting.id)}
                  className="h-8 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(meeting)}
                className="h-8 text-xs text-foreground/80 hover:bg-card gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1.5">{meeting.title}</h2>

          {meeting.description && (
            <p className="text-xs text-secondary-text mb-3 leading-relaxed">
              {meeting.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary-text pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                {format(startTime, "EEEE, MMMM d, yyyy • h:mm a")} – {format(endTime, "h:mm a")} ({durationMins}m)
              </span>
            </div>

            {meeting.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span>{meeting.location}</span>
                <button
                  onClick={copyAddress}
                  className="text-secondary-text hover:text-foreground ml-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-border/60 bg-[#090E18] text-xs">
          <button
            onClick={() => setActiveTab("agenda")}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-all ${
              activeTab === "agenda"
                ? "border-primary text-primary"
                : "border-transparent text-secondary-text hover:text-foreground"
            }`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span>Agenda ({meeting.agendaItems?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("participants")}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-all ${
              activeTab === "participants"
                ? "border-primary text-primary"
                : "border-transparent text-secondary-text hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Participants ({meeting.attendees?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-all ${
              activeTab === "notes"
                ? "border-primary text-primary"
                : "border-transparent text-secondary-text hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Discussion Notes</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-all ${
              activeTab === "tasks"
                ? "border-primary text-primary"
                : "border-transparent text-secondary-text hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Follow-up Tasks ({meeting.tasks?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("attachments")}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 transition-all ${
              activeTab === "attachments"
                ? "border-primary text-primary"
                : "border-transparent text-secondary-text hover:text-foreground"
            }`}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>Attachments ({meeting.attachments?.length || 0})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 max-h-[55vh]">
          {/* Agenda Tab */}
          {activeTab === "agenda" && (
            <div className="space-y-4">
              <form onSubmit={handleAddAgendaItem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New agenda item title..."
                  value={newAgTitle}
                  onChange={(e) => setNewAgTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="mins"
                  value={newAgDuration}
                  onChange={(e) => setNewAgDuration(e.target.value)}
                  className="w-16 px-2 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button type="submit" size="sm" className="h-9 px-3 text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item</span>
                </Button>
              </form>

              <div className="space-y-2">
                {(!meeting.agendaItems || meeting.agendaItems.length === 0) ? (
                  <p className="text-xs text-secondary-text italic py-4 text-center">
                    No agenda items yet. Add items above to structure this meeting.
                  </p>
                ) : (
                  meeting.agendaItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${
                        item.isCompleted
                          ? "bg-emerald-500/5 border-emerald-500/20 text-secondary-text"
                          : "bg-card/40 border-border/60 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAgendaItem(item.id, item.isCompleted)}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          {item.isCompleted ? (
                            <CheckSquare className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Square className="h-4 w-4 text-secondary-text" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className={`font-medium ${item.isCompleted ? "line-through opacity-70" : ""}`}>
                            {index + 1}. {item.title}
                          </span>
                          {item.description && (
                            <p className="text-[11px] text-secondary-text truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-card text-secondary-text border border-border/60 shrink-0">
                          {item.durationMinutes}m
                        </span>
                      </div>

                      <div className="flex items-center gap-1 ml-3 shrink-0">
                        <button
                          onClick={() => handleMoveAgenda(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-secondary-text hover:text-foreground disabled:opacity-20"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMoveAgenda(index, "down")}
                          disabled={index === (meeting.agendaItems?.length || 1) - 1}
                          className="p-1 text-secondary-text hover:text-foreground disabled:opacity-20"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgendaItem(item.id)}
                          className="p-1 text-secondary-text hover:text-red-400 ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === "participants" && (
            <div className="space-y-4">
              <form onSubmit={handleAddAttendee} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Participant name *"
                  value={newAttName}
                  onChange={(e) => setNewAttName(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newAttEmail}
                  onChange={(e) => setNewAttEmail(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button type="submit" size="sm" className="h-9 text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </Button>
              </form>

              <div className="space-y-2">
                {(!meeting.attendees || meeting.attendees.length === 0) ? (
                  <p className="text-xs text-secondary-text italic py-4 text-center">
                    No participants added yet.
                  </p>
                ) : (
                  meeting.attendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-card/40 border border-border/60 text-xs gap-2"
                    >
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{attendee.name}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                            {attendee.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-secondary-text flex items-center gap-2 mt-0.5">
                          {attendee.email && <span>{attendee.email}</span>}
                          {attendee.phone && <span>• {attendee.phone}</span>}
                          {attendee.organization && <span>• {attendee.organization}</span>}
                        </div>
                      </div>

                      {/* Attendance Action buttons */}
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        <button
                          onClick={() => handleUpdateAttendeeStatus(attendee.id, "ATTENDED")}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            attendee.status === "ATTENDED"
                              ? "bg-emerald-500/20 text-emerald-400 font-bold"
                              : "bg-card hover:bg-card/80 text-secondary-text"
                          }`}
                        >
                          Attended
                        </button>
                        <button
                          onClick={() => handleUpdateAttendeeStatus(attendee.id, "ABSENT")}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            attendee.status === "ABSENT"
                              ? "bg-rose-500/20 text-rose-400 font-bold"
                              : "bg-card hover:bg-card/80 text-secondary-text"
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleUpdateAttendeeStatus(attendee.id, "ACCEPTED")}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            attendee.status === "ACCEPTED"
                              ? "bg-cyan-500/20 text-cyan-400 font-bold"
                              : "bg-card hover:bg-card/80 text-secondary-text"
                          }`}
                        >
                          Accepted
                        </button>
                        <button
                          onClick={() => handleRemoveAttendee(attendee.id)}
                          className="p-1 text-secondary-text hover:text-red-400 ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-secondary-text mb-1">
                    Discussion Summary
                  </label>
                  <textarea
                    rows={3}
                    value={discussionSummary}
                    onChange={(e) => setDiscussionSummary(e.target.value)}
                    placeholder="High-level overview of topics discussed..."
                    className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary-text mb-1">
                    Key Decisions
                  </label>
                  <textarea
                    rows={3}
                    value={keyDecisions}
                    onChange={(e) => setKeyDecisions(e.target.value)}
                    placeholder="Formal decisions made during this meeting..."
                    className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary-text mb-1">
                    Important Points
                  </label>
                  <textarea
                    rows={3}
                    value={importantPoints}
                    onChange={(e) => setImportantPoints(e.target.value)}
                    placeholder="Key takeaways or critical highlights..."
                    className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary-text mb-1">
                    Follow-Up Info
                  </label>
                  <textarea
                    rows={3}
                    value={followUpInfo}
                    onChange={(e) => setFollowUpInfo(e.target.value)}
                    placeholder="Next steps, owners, deadlines..."
                    className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary-text mb-1">
                  Full Meeting Notes (Saved in Notes Manager)
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Detailed meeting minutes, transcription notes, scratchpad..."
                  className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {notesSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Notes saved
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingNotes ? "Saving..." : "Save Notes"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Follow-up Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <form onSubmit={handleCreateTask} className="p-3 rounded-lg bg-card/40 border border-border/60 space-y-2">
                <span className="text-xs font-semibold text-foreground">Create Follow-Up Task</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Task title *"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "CRITICAL" | "HIGH" | "NORMAL" | "LOW")}
                    className="px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creatingTask || !taskTitle.trim()}
                    className="h-8 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Task</span>
                  </Button>
                </div>
              </form>

              <div className="space-y-2">
                {(!meeting.tasks || meeting.tasks.length === 0) ? (
                  <p className="text-xs text-secondary-text italic py-4 text-center">
                    No follow-up tasks linked to this meeting.
                  </p>
                ) : (
                  meeting.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === "HIGH" || task.priority === "CRITICAL"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {task.priority}
                        </span>
                        <span className="font-medium text-foreground">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-secondary-text">
                        {task.dueDate && (
                          <span>Due {format(new Date(task.dueDate), "MMM d")}</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary/80 text-foreground font-semibold">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === "attachments" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={selectedFileToAttach}
                  onChange={(e) => setSelectedFileToAttach(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select a file from File Manager...</option>
                  {availableFiles.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.originalName} ({f.category})
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAttachFile}
                  disabled={!selectedFileToAttach}
                  className="text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Attach</span>
                </Button>
              </div>

              <div className="space-y-2">
                {(!meeting.attachments || meeting.attachments.length === 0) ? (
                  <p className="text-xs text-secondary-text italic py-4 text-center">
                    No files attached to this meeting.
                  </p>
                ) : (
                  meeting.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Paperclip className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {att.file?.originalName || "Attached file"}
                        </span>
                        {att.file?.sizeBytes && (
                          <span className="text-[10px] text-secondary-text shrink-0">
                            ({Math.round(att.file.sizeBytes / 1024)} KB)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {att.file?.id && (
                          <a
                            href={`/api/files/${att.file.id}/download`}
                            download
                            className="p-1 text-secondary-text hover:text-foreground"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDetachFile(att.fileId)}
                          className="p-1 text-secondary-text hover:text-red-400"
                          title="Unlink"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
