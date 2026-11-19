"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Video,
  MapPin,
  ExternalLink,
  Users,
  Plus,
  ArrowRight,
  Phone,
} from "lucide-react";
import { MeetingDto } from "@/modules/meetings/types";

interface DashboardMeetingsWidgetProps {
  todayMeetings: MeetingDto[];
}

export function DashboardMeetingsWidget({
  todayMeetings,
}: DashboardMeetingsWidgetProps) {
  const now = new Date();

  // Sort chronologically by startTime
  const sortedMeetings = [...todayMeetings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Find next upcoming meeting (first meeting where endTime > now)
  const nextMeeting = sortedMeetings.find(
    (m) => new Date(m.endTime).getTime() > now.getTime()
  );

  const formatTime = (dateStr: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "GOOGLE_MEET":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#262626] border border-[#383838] px-1.5 py-0.5 text-[10px] font-medium text-[#A3A3A3]">
            <Video className="h-2.5 w-2.5" />
            Google Meet
          </span>
        );
      case "ZOOM":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#262626] border border-[#383838] px-1.5 py-0.5 text-[10px] font-medium text-[#A3A3A3]">
            <Video className="h-2.5 w-2.5" />
            Zoom
          </span>
        );
      case "TEAMS":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#262626] border border-[#383838] px-1.5 py-0.5 text-[10px] font-medium text-[#A3A3A3]">
            <Video className="h-2.5 w-2.5" />
            Teams
          </span>
        );
      case "PHONE":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#262626] border border-[#383838] px-1.5 py-0.5 text-[10px] font-medium text-[#A3A3A3]">
            <Phone className="h-2.5 w-2.5" />
            Phone
          </span>
        );
      case "IN_PERSON":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-[#262626] border border-[#383838] px-1.5 py-0.5 text-[10px] font-medium text-[#A3A3A3]">
            <MapPin className="h-2.5 w-2.5" />
            In-Person
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-[#292929] bg-[#202020] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#292929]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#A3A3A3]" />
          <h2 className="text-base font-semibold text-[#F5F5F5]">
            Today&apos;s Meetings
          </h2>
          <span className="rounded-full bg-[#181818] border border-[#292929] px-2 py-0.5 text-xs text-[#737373] font-medium">
            {todayMeetings.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/meetings"
            className="flex items-center gap-1 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
          >
            <span>View Schedule</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Meeting list */}
      <div className="mt-3 space-y-2.5">
        {sortedMeetings.length === 0 ? (
          <div className="rounded-lg bg-[#181818]/40 py-8 px-4 text-center">
            <Calendar className="mx-auto h-6 w-6 text-[#555555] mb-2" />
            <p className="text-xs font-medium text-[#F5F5F5]">
              No meetings scheduled for today
            </p>
            <p className="text-[11px] text-[#737373] mt-1 max-w-xs mx-auto">
              Your schedule is open. Dedicated focus time.
            </p>
            <Link
              href="/meetings"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#262626] px-3 py-1.5 text-xs font-medium text-[#F5F5F5] hover:bg-[#303030] transition-colors"
            >
              <Plus className="h-3 w-3 text-[#A3A3A3]" />
              Schedule Meeting
            </Link>
          </div>
        ) : (
          sortedMeetings.map((meeting) => {
            const isNext = nextMeeting?.id === meeting.id;
            const hasStarted =
              new Date(meeting.startTime).getTime() <= now.getTime() &&
              new Date(meeting.endTime).getTime() >= now.getTime();

            return (
              <div
                key={meeting.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 transition-all ${
                  isNext
                    ? "border-[#454545] bg-[#242424] shadow-sm"
                    : "border-[#292929] bg-[#181818] hover:bg-[#222222] hover:border-[#383838]"
                }`}
              >
                {/* Left: Next Up indicator + Time + Title */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-[#292929] bg-[#202020] px-2.5 py-1.5 text-center shrink-0 min-w-[70px]">
                    <span className="text-[11px] font-bold text-[#F5F5F5]">
                      {formatTime(meeting.startTime)}
                    </span>
                    <span className="text-[10px] text-[#737373]">
                      to {formatTime(meeting.endTime)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/meetings?id=${meeting.id}`}
                        className="truncate text-xs font-medium text-[#F5F5F5] hover:text-[#FFFFFF] transition-colors"
                      >
                        {meeting.title}
                      </Link>

                      {isNext && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#2D2D2D] border border-[#404040] px-1.5 py-0.2 text-[9px] font-medium text-[#D4D4D4]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#A3A3A3]" />
                          {hasStarted ? "HAPPENING NOW" : "NEXT UP"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#737373]">
                      {getTypeBadge(meeting.meetingType)}

                      {meeting.attendees && meeting.attendees.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#737373]">
                          <Users className="h-3 w-3" />
                          {meeting.attendees.length} attendee
                          {meeting.attendees.length === 1 ? "" : "s"}
                        </span>
                      )}

                      {meeting.location && !meeting.meetingUrl && (
                        <span className="flex items-center gap-1 text-[10px] text-[#737373] truncate">
                          <MapPin className="h-3 w-3" />
                          {meeting.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Join Call Action */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {meeting.meetingUrl ? (
                    <a
                      href={meeting.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#383838] hover:bg-[#454545] border border-[#484848]/40 text-[#F5F5F5] px-3 py-1.5 text-xs font-medium shadow-sm transition-colors"
                    >
                      <Video className="h-3 w-3" />
                      <span>Join Call</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  ) : (
                    <Link
                      href={`/meetings?id=${meeting.id}`}
                      className="rounded-lg border border-[#303030] bg-[#222222] px-2.5 py-1 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#282828] transition-colors"
                    >
                      Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
