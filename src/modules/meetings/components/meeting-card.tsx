"use client";

import React, { useState } from "react";
import {
  Video,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Calendar,
  Users,
  ListTodo,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertCircle,
  Trash2,
  Edit2,
} from "lucide-react";
import { format, differenceInMinutes, isToday, isTomorrow } from "date-fns";
import { MeetingDto, MeetingStatus } from "../types";
import { Button } from "@/components/ui/button";

interface MeetingCardProps {
  meeting: MeetingDto;
  onOpenDetails: (meeting: MeetingDto) => void;
  onEdit: (meeting: MeetingDto) => void;
  onReschedule: (meeting: MeetingDto) => void;
  onStart: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  onNoShow: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (meeting: MeetingDto) => void;
}

export function MeetingCard({
  meeting,
  onOpenDetails,
  onEdit,
  onReschedule,
  onStart,
  onComplete,
  onNoShow,
  onCancel,
  onDelete,
}: MeetingCardProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const durationMins = Math.max(1, differenceInMinutes(endTime, startTime));

  const formatMeetingDate = () => {
    if (isToday(startTime)) {
      return `Today, ${format(startTime, "h:mm a")} – ${format(endTime, "h:mm a")}`;
    }
    if (isTomorrow(startTime)) {
      return `Tomorrow, ${format(startTime, "h:mm a")} – ${format(endTime, "h:mm a")}`;
    }
    return `${format(startTime, "EEE, MMM d")} • ${format(startTime, "h:mm a")} – ${format(endTime, "h:mm a")}`;
  };

  const copyLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meeting.location) {
      navigator.clipboard.writeText(meeting.location);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            In Progress
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
      case "RESCHEDULED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Rescheduled
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            No Show
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = () => {
    switch (meeting.meetingType) {
      case "ONLINE":
        return <Video className="h-4 w-4 text-cyan-400" />;
      case "PHYSICAL":
        return <MapPin className="h-4 w-4 text-amber-400" />;
      case "PHONE":
        return <Phone className="h-4 w-4 text-emerald-400" />;
    }
  };

  return (
    <div
      onClick={() => onOpenDetails(meeting)}
      className="group relative flex flex-col justify-between p-4 rounded-xl bg-card/60 hover:bg-card/90 border border-border/60 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Header: Type, Status, Priority & Action menu */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/50 border border-border/60 text-xs text-foreground/80">
              {getTypeIcon()}
              <span className="capitalize">{meeting.meetingType.toLowerCase()}</span>
            </div>

            {getStatusBadge(meeting.status)}

            {meeting.priority === "HIGH" && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 text-[11px] font-bold tracking-wide">
                HIGH
              </span>
            )}
          </div>

          {/* Action Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-7 w-7 p-0 text-secondary-text hover:text-foreground rounded-md"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-44 rounded-lg bg-[#0F172A] border border-border/80 shadow-xl py-1 text-xs text-foreground">
                  {meeting.status !== "IN_PROGRESS" && meeting.status !== "COMPLETED" && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStart(meeting.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-emerald-400"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>Start Meeting</span>
                    </button>
                  )}

                  {meeting.status !== "COMPLETED" && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onComplete(meeting.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-green-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onReschedule(meeting);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-amber-400"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Reschedule</span>
                  </button>

                  {meeting.status !== "NO_SHOW" && meeting.status !== "COMPLETED" && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onNoShow(meeting.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-purple-400"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Mark No-Show</span>
                    </button>
                  )}

                  {meeting.status !== "CANCELLED" && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onCancel(meeting.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-rose-400"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Cancel Meeting</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-border/50" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(meeting);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-foreground"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(meeting);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors line-clamp-1 mb-1">
          {meeting.title}
        </h3>

        {meeting.description && (
          <p className="text-xs text-secondary-text line-clamp-2 mb-3 leading-relaxed">
            {meeting.description}
          </p>
        )}

        {/* Date, Time & Duration */}
        <div className="flex items-center gap-2 text-xs text-secondary-text mb-3">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground/90">{formatMeetingDate()}</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-card text-secondary-text border border-border/40">
            {durationMins}m
          </span>
        </div>

        {/* Link / Location Row */}
        {meeting.meetingType === "ONLINE" && meeting.meetingUrl && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/30 text-xs font-semibold text-primary transition-all shadow-sm group/btn"
            >
              <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
              <span>Join Meeting</span>
            </a>
          </div>
        )}

        {meeting.meetingType === "PHYSICAL" && meeting.location && (
          <div
            className="flex items-center gap-2 mb-3 text-xs text-secondary-text bg-[#0D1524] px-2.5 py-1.5 rounded-lg border border-border/40"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate flex-1 text-foreground/80">{meeting.location}</span>
            <button
              onClick={copyLocation}
              title="Copy Address"
              className="text-secondary-text hover:text-foreground transition-colors p-1"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}

        {meeting.meetingType === "PHONE" && meeting.location && (
          <div className="flex items-center gap-2 mb-3 text-xs text-secondary-text bg-[#0D1524] px-2.5 py-1.5 rounded-lg border border-border/40">
            <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate flex-1 text-foreground/80">{meeting.location}</span>
          </div>
        )}
      </div>

      {/* Footer: Attendees & Badges */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-secondary-text">
        {/* Attendees preview */}
        <div className="flex items-center gap-1.5">
          {meeting.attendees && meeting.attendees.length > 0 ? (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary/80" />
              <span className="font-medium text-foreground/80">
                {meeting.attendees.length} participant{meeting.attendees.length > 1 ? "s" : ""}
              </span>
              <div className="flex -space-x-1 ml-1 overflow-hidden">
                {meeting.attendees.slice(0, 3).map((a, i) => (
                  <span
                    key={a.id || i}
                    title={`${a.name} (${a.status})`}
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 border border-background text-[10px] font-semibold text-primary"
                  >
                    {a.name.charAt(0).toUpperCase()}
                  </span>
                ))}
                {meeting.attendees.length > 3 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-secondary/80 border border-background text-[9px] text-foreground font-medium">
                    +{meeting.attendees.length - 3}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-secondary-text/60 italic">No participants</span>
          )}
        </div>

        {/* Feature Counters */}
        <div className="flex items-center gap-2 text-secondary-text">
          {(meeting.agendaCount ?? 0) > 0 && (
            <span
              className="flex items-center gap-1"
              title={`${meeting.agendaCount} agenda item(s)`}
            >
              <ListTodo className="h-3.5 w-3.5 text-cyan-400" />
              <span>{meeting.agendaCount}</span>
            </span>
          )}

          {(meeting.notes?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1" title="Notes attached">
              <FileText className="h-3.5 w-3.5 text-purple-400" />
            </span>
          )}

          {(meeting.taskCount ?? 0) > 0 && (
            <span
              className="flex items-center gap-1"
              title={`${meeting.taskCount} follow-up task(s)`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{meeting.taskCount}</span>
            </span>
          )}

          {(meeting.attachmentCount ?? 0) > 0 && (
            <span
              className="flex items-center gap-1"
              title={`${meeting.attachmentCount} attachment(s)`}
            >
              <Paperclip className="h-3.5 w-3.5 text-amber-400" />
              <span>{meeting.attachmentCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
