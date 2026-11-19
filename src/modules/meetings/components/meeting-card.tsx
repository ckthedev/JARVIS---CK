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
  Paperclip,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertCircle,
  Trash2,
  Edit2,
  CheckSquare,
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

  const copyLocationOrUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = meeting.meetingUrl || meeting.location;
    if (target) {
      navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            In Progress
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/10 text-green-400 border border-green-500/30">
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/30 line-through">
            Cancelled
          </span>
        );
      case "RESCHEDULED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Rescheduled
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
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
        return <Video className="h-3.5 w-3.5 text-blue-400" />;
      case "PHYSICAL":
        return <MapPin className="h-3.5 w-3.5 text-amber-400" />;
      case "PHONE":
        return <Phone className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <div
      onClick={() => onOpenDetails(meeting)}
      className="group relative flex flex-col justify-between p-4 rounded-xl bg-[#202020] hover:bg-[#2C2C2C] border border-[#303030] hover:border-[#8B5CF6]/50 transition-all duration-200 cursor-pointer shadow-sm"
    >
      <div>
        {/* Header: Type, Status, Priority & Menu */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181818] border border-[#303030] text-[11px] text-[#A3A3A3]">
              {getTypeIcon()}
              <span className="capitalize">{meeting.meetingType.toLowerCase()}</span>
            </div>

            {getStatusBadge(meeting.status)}

            {meeting.priority === "HIGH" && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold tracking-wider">
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
              className="h-7 w-7 p-0 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#262626] rounded"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-44 rounded-lg bg-[#181818] border border-[#303030] shadow-xl py-1 text-xs text-[#F5F5F5]">
                  {meeting.status !== "IN_PROGRESS" && meeting.status !== "COMPLETED" && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onStart(meeting.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-emerald-400 text-left"
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
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-green-400 text-left"
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
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-amber-400 text-left"
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
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-purple-400 text-left"
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
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-red-400 text-left"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Cancel Meeting</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#303030]" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(meeting);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-[#F5F5F5] text-left"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-[#A3A3A3]" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(meeting);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#262626] text-red-400 text-left"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Meeting Title */}
        <h3 className="font-semibold text-sm text-[#F5F5F5] group-hover:text-white line-clamp-1 mb-1">
          {meeting.title}
        </h3>

        {/* Date & Time */}
        <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3] mb-2">
          <Clock className="h-3.5 w-3.5 text-[#737373] shrink-0" />
          <span>{formatMeetingDate()}</span>
          <span className="text-[#737373]">({durationMins}m)</span>
        </div>

        {/* Location or Meeting Link */}
        {(meeting.meetingUrl || meeting.location) && (
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-3 p-1.5 rounded bg-[#181818] border border-[#303030]/60">
            {meeting.meetingType === "ONLINE" ? (
              <Video className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            ) : (
              <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            )}
            <span className="truncate flex-1 font-mono text-[11px] text-[#A3A3A3]">
              {meeting.meetingUrl || meeting.location}
            </span>
            {meeting.meetingUrl && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open meeting link"
                className="text-[#737373] hover:text-[#8B5CF6] transition-colors p-0.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={copyLocationOrUrl}
              title="Copy location / URL"
              className="text-[#737373] hover:text-[#F5F5F5] transition-colors p-0.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer Metrics & Entities Counts */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#303030] text-xs text-[#737373]">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1"
            title={`${meeting.attendeeCount || (meeting.attendees ? meeting.attendees.length : 0)} Participants`}
          >
            <Users className="h-3 w-3" />
            <span className="text-[11px]">
              {meeting.attendeeCount || (meeting.attendees ? meeting.attendees.length : 0)}
            </span>
          </div>

          <div
            className="flex items-center gap-1"
            title={`${meeting.agendaCount || (meeting.agendaItems ? meeting.agendaItems.length : 0)} Agenda Items`}
          >
            <ListTodo className="h-3 w-3" />
            <span className="text-[11px]">
              {meeting.agendaCount || (meeting.agendaItems ? meeting.agendaItems.length : 0)}
            </span>
          </div>

          <div
            className="flex items-center gap-1"
            title={`${meeting.taskCount || (meeting.tasks ? meeting.tasks.length : 0)} Linked Action Tasks`}
          >
            <CheckSquare className="h-3 w-3" />
            <span className="text-[11px]">
              {meeting.taskCount || (meeting.tasks ? meeting.tasks.length : 0)}
            </span>
          </div>

          <div
            className="flex items-center gap-1"
            title={`${meeting.attachmentCount || (meeting.attachments ? meeting.attachments.length : 0)} Attachments`}
          >
            <Paperclip className="h-3 w-3" />
            <span className="text-[11px]">
              {meeting.attachmentCount || (meeting.attachments ? meeting.attachments.length : 0)}
            </span>
          </div>
        </div>

        <span className="text-[11px] text-[#A3A3A3] group-hover:text-[#8B5CF6] transition-colors font-medium">
          Inspect &rarr;
        </span>
      </div>
    </div>
  );
}
