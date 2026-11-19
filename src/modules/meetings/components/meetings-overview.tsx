"use client";

import React from "react";
import {
  Calendar,
  Clock,
  CalendarCheck,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Video,
  MapPin,
  Phone,
  Plus,
  ArrowRight,
  ExternalLink,
  Users,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { MeetingDto, MeetingStats } from "../types";
import { MetricCard } from "@/components/dark-workspace";
import { Button } from "@/components/ui/button";

interface MeetingsOverviewProps {
  meetings: MeetingDto[];
  stats?: MeetingStats;
  onOpenDetails: (meeting: MeetingDto) => void;
  onOpenCreate: () => void;
  onViewCalendar: () => void;
  onViewAll: () => void;
}

export function MeetingsOverview({
  meetings,
  stats,
  onOpenDetails,
  onOpenCreate,
  onViewCalendar,
  onViewAll,
}: MeetingsOverviewProps) {
  // Filter today's meetings
  const todayMeetings = meetings.filter((m) => isToday(new Date(m.startTime)));

  // Filter upcoming meetings
  const upcomingMeetings = meetings
    .filter((m) => {
      const start = new Date(m.startTime);
      return (
        start.getTime() > Date.now() &&
        (m.status === "SCHEDULED" || m.status === "RESCHEDULED" || m.status === "IN_PROGRESS")
      );
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  // Compute meeting type distribution
  const totalCount = meetings.length || 1;
  const onlineCount = meetings.filter((m) => m.meetingType === "ONLINE").length;
  const physicalCount = meetings.filter((m) => m.meetingType === "PHYSICAL").length;
  const phoneCount = meetings.filter((m) => m.meetingType === "PHONE").length;

  const onlinePct = Math.round((onlineCount / totalCount) * 100);
  const physicalPct = Math.round((physicalCount / totalCount) * 100);
  const phonePct = Math.max(0, 100 - onlinePct - physicalPct);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Total Meetings"
          value={stats?.total ?? meetings.length}
          subtext="All scheduled records"
          icon={Calendar}
          iconColor="#8B5CF6"
          accentColor="#8B5CF6"
        />
        <MetricCard
          title="Today's Meetings"
          value={stats?.today ?? todayMeetings.length}
          subtext="Scheduled for today"
          icon={Clock}
          iconColor="#F59E0B"
          accentColor="#F59E0B"
        />
        <MetricCard
          title="Upcoming"
          value={stats?.upcoming ?? upcomingMeetings.length}
          subtext="On future calendar"
          icon={CalendarCheck}
          iconColor="#3B82F6"
          accentColor="#3B82F6"
        />
        <MetricCard
          title="In Progress"
          value={stats?.inProgress ?? 0}
          subtext="Active right now"
          icon={PlayCircle}
          iconColor="#22C55E"
          accentColor="#22C55E"
        />
        <MetricCard
          title="Completed"
          value={stats?.completed ?? 0}
          subtext="Concluded sessions"
          icon={CheckCircle2}
          iconColor="#10B981"
          accentColor="#10B981"
        />
        <MetricCard
          title="High Priority"
          value={stats?.highPriorityCount ?? 0}
          subtext="Require preparation"
          icon={AlertTriangle}
          iconColor="#EF4444"
          accentColor="#EF4444"
        />
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Schedule & Upcoming Meetings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Card */}
          <div className="rounded-xl bg-[#202020] border border-[#303030] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#8B5CF6]" />
                <h3 className="font-semibold text-sm text-[#F5F5F5]">
                  Today&apos;s Schedule
                </h3>
              </div>
              <span className="text-xs text-[#737373]">
                {todayMeetings.length} meeting{todayMeetings.length === 1 ? "" : "s"} today
              </span>
            </div>

            {todayMeetings.length === 0 ? (
              <div className="py-8 text-center bg-[#181818] rounded-lg border border-[#303030]/60">
                <p className="text-xs text-[#A3A3A3]">
                  No meetings scheduled for today. You have clear focus time.
                </p>
                <button
                  onClick={onOpenCreate}
                  className="mt-2 text-xs text-[#8B5CF6] hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Schedule a meeting
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onOpenDetails(m)}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#181818] hover:bg-[#262626] border border-[#303030] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs text-[#F5F5F5] truncate">
                          {m.title}
                        </span>
                        {m.priority === "HIGH" && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                            HIGH
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#737373]">
                        <span className="text-[#A3A3A3]">
                          {format(new Date(m.startTime), "h:mm a")} –{" "}
                          {format(new Date(m.endTime), "h:mm a")}
                        </span>
                        {m.location && <span>• {m.location}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {m.meetingUrl && (
                        <a
                          href={m.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded bg-[#262626] hover:bg-[#303030] text-[#8B5CF6] border border-[#303030] text-xs font-medium inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Join</span>
                        </a>
                      )}
                      <span className="text-xs text-[#737373] hover:text-[#F5F5F5]">
                        Inspect &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Meetings List */}
          <div className="rounded-xl bg-[#202020] border border-[#303030] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-[#F5F5F5]">
                  Upcoming Pipeline
                </h3>
              </div>
              <button
                onClick={onViewAll}
                className="text-xs text-[#8B5CF6] hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="py-8 text-center bg-[#181818] rounded-lg border border-[#303030]/60">
                <p className="text-xs text-[#737373]">
                  No upcoming meetings on the schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onOpenDetails(m)}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#181818] hover:bg-[#262626] border border-[#303030] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs text-[#F5F5F5] truncate">
                          {m.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#202020] border border-[#303030] text-[#A3A3A3] capitalize">
                          {m.meetingType.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#737373]">
                        <span className="text-[#A3A3A3]">
                          {format(new Date(m.startTime), "EEE, MMM d • h:mm a")}
                        </span>
                        {(m.attendeeCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" />
                            {m.attendeeCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-[#737373] hover:text-[#8B5CF6] transition-colors ml-3 shrink-0">
                      View details &rarr;
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Breakdown & Quick Actions */}
        <div className="space-y-6">
          {/* Meeting Format Distribution */}
          <div className="rounded-xl bg-[#202020] border border-[#303030] p-5">
            <h3 className="font-semibold text-sm text-[#F5F5F5] mb-3">
              Meeting Modality Breakdown
            </h3>

            {/* Segmented meter bar */}
            <div className="h-2 w-full rounded-full bg-[#181818] overflow-hidden flex mb-4">
              <div
                style={{ width: `${onlinePct}%` }}
                className="h-full bg-blue-500"
                title={`Online: ${onlinePct}%`}
              />
              <div
                style={{ width: `${physicalPct}%` }}
                className="h-full bg-amber-500"
                title={`Physical: ${physicalPct}%`}
              />
              <div
                style={{ width: `${phonePct}%` }}
                className="h-full bg-emerald-500"
                title={`Phone: ${phonePct}%`}
              />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[#181818] border border-[#303030]/60">
                <div className="flex items-center gap-2 text-[#A3A3A3]">
                  <Video className="h-3.5 w-3.5 text-blue-400" />
                  <span>Online Calls</span>
                </div>
                <span className="font-semibold text-[#F5F5F5]">
                  {onlineCount} ({onlinePct}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#181818] border border-[#303030]/60">
                <div className="flex items-center gap-2 text-[#A3A3A3]">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  <span>In-Person / Physical</span>
                </div>
                <span className="font-semibold text-[#F5F5F5]">
                  {physicalCount} ({physicalPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#181818] border border-[#303030]/60">
                <div className="flex items-center gap-2 text-[#A3A3A3]">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Phone Calls</span>
                </div>
                <span className="font-semibold text-[#F5F5F5]">
                  {phoneCount} ({phonePct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Operations Panel */}
          <div className="rounded-xl bg-[#202020] border border-[#303030] p-5">
            <h3 className="font-semibold text-sm text-[#F5F5F5] mb-3">
              Meeting Shortcuts
            </h3>
            <div className="space-y-2">
              <Button
                onClick={onOpenCreate}
                className="w-full justify-start gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule New Meeting</span>
              </Button>
              <Button
                variant="outline"
                onClick={onViewCalendar}
                className="w-full justify-start gap-2 bg-[#181818] border-[#303030] text-[#F5F5F5] hover:bg-[#262626] text-xs"
              >
                <Calendar className="h-3.5 w-3.5 text-[#8B5CF6]" />
                <span>Open Calendar View</span>
              </Button>
              <Button
                variant="outline"
                onClick={onViewAll}
                className="w-full justify-start gap-2 bg-[#181818] border-[#303030] text-[#F5F5F5] hover:bg-[#262626] text-xs"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Manage All Meetings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
