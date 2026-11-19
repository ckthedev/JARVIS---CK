"use client";

import React, { useState } from "react";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  ExternalLink,
} from "lucide-react";
import { MeetingDto, CalendarViewMode, MeetingStatus } from "../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  meetings: MeetingDto[];
  onOpenDetails: (meeting: MeetingDto) => void;
  onOpenCreateWithDate: (date: Date) => void;
}

export function CalendarView({
  meetings,
  onOpenDetails,
  onOpenCreateWithDate,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<CalendarViewMode>("month");

  // Navigation handlers
  const handlePrev = () => {
    if (mode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (mode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (mode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (mode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Status color pill
  const getStatusColorClass = (status: MeetingStatus) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20";
      case "SCHEDULED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20";
      case "COMPLETED":
        return "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/30 line-through opacity-60";
      case "RESCHEDULED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20";
      case "NO_SHOW":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20";
      default:
        return "bg-[#262626] text-[#F5F5F5] border-[#303030]";
    }
  };

  // Month grid calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Week calculation
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter meetings for a specific day
  const getMeetingsForDay = (day: Date) => {
    return meetings.filter((m) => isSameDay(new Date(m.startTime), day));
  };

  return (
    <div className="flex flex-col h-full bg-[#101010]">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-b border-[#303030] bg-[#141414]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-7 w-7 p-0 bg-[#181818] border-[#303030] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-7 text-xs font-medium px-2.5 bg-[#181818] border-[#303030] text-[#F5F5F5] hover:bg-[#202020]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-7 w-7 p-0 bg-[#181818] border-[#303030] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <h2 className="text-sm font-semibold text-[#F5F5F5]">
            {mode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
            {mode === "week" &&
              `Week of ${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`}
            {mode === "month" && format(currentDate, "MMMM yyyy")}
            {mode === "agenda" && `Upcoming Agenda (${format(currentDate, "MMMM yyyy")})`}
          </h2>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#181818] border border-[#303030] text-xs">
          {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={cn(
                "px-2.5 py-1 rounded capitalize transition-colors text-xs",
                mode === v
                  ? "bg-[#262626] text-[#F5F5F5] font-semibold shadow-sm"
                  : "text-[#737373] hover:text-[#F5F5F5]"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Renderings */}
      <div className="flex-1 overflow-auto p-4">
        {/* Month View */}
        {mode === "month" && (
          <div className="grid grid-cols-7 border border-[#303030] rounded-xl overflow-hidden bg-[#141414]">
            {/* Weekday headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                className="p-2 text-center text-[11px] font-semibold text-[#737373] uppercase tracking-wider bg-[#181818] border-b border-[#303030]"
              >
                {dayName}
              </div>
            ))}

            {/* Month Day Cells */}
            {monthDays.map((day: Date) => {
              const dayMeetings = getMeetingsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onOpenCreateWithDate(day)}
                  className={cn(
                    "min-h-[110px] p-2 border-b border-r border-[#303030] transition-colors flex flex-col justify-between group relative cursor-pointer hover:bg-[#202020]",
                    !isCurrentMonth ? "opacity-30 bg-[#101010]" : "bg-[#141414]",
                    isCurrentDay && "bg-[#8B5CF6]/5 border-l-2 border-l-[#8B5CF6]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs font-semibold h-5 w-5 flex items-center justify-center rounded-full",
                        isCurrentDay
                          ? "bg-[#8B5CF6] text-white font-bold"
                          : "text-[#A3A3A3]"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCreateWithDate(day);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#737373] hover:text-[#F5F5F5] p-0.5 rounded transition-opacity"
                      title="Schedule meeting on this day"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Meetings in cell */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-24">
                    {dayMeetings.map((m) => (
                      <div
                        key={m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(m);
                        }}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium border truncate transition-all",
                          getStatusColorClass(m.status)
                        )}
                        title={`${m.title} (${format(new Date(m.startTime), "h:mm a")})`}
                      >
                        <span className="font-semibold mr-1">
                          {format(new Date(m.startTime), "h:mm")}
                        </span>
                        <span>{m.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {mode === "week" && (
          <div className="grid grid-cols-7 gap-3 h-full">
            {weekDays.map((day: Date) => {
              const dayMeetings = getMeetingsForDay(day);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex flex-col rounded-xl border p-3 bg-[#181818]",
                    isCurrentDay
                      ? "border-[#8B5CF6]/50 shadow-sm"
                      : "border-[#303030]"
                  )}
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#303030]">
                    <div>
                      <div className="text-[11px] uppercase font-semibold text-[#737373]">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={cn(
                          "text-sm font-bold",
                          isCurrentDay ? "text-[#8B5CF6]" : "text-[#F5F5F5]"
                        )}
                      >
                        {format(day, "MMM d")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenCreateWithDate(day)}
                      className="h-6 w-6 p-0 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#202020]"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayMeetings.length === 0 ? (
                      <p className="text-[11px] text-[#737373] italic text-center py-6">
                        No meetings
                      </p>
                    ) : (
                      dayMeetings.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => onOpenDetails(m)}
                          className={cn(
                            "p-2 rounded-lg border text-xs cursor-pointer transition-all",
                            getStatusColorClass(m.status)
                          )}
                        >
                          <div className="font-semibold truncate mb-0.5">{m.title}</div>
                          <div className="text-[10px] opacity-80 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            <span>
                              {format(new Date(m.startTime), "h:mm a")} -{" "}
                              {format(new Date(m.endTime), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Day View */}
        {mode === "day" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#181818] border border-[#303030]">
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F5]">
                  {format(currentDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <p className="text-xs text-[#737373]">
                  {getMeetingsForDay(currentDate).length} meeting(s) scheduled for this day
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onOpenCreateWithDate(currentDate)}
                className="gap-1.5 text-xs bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule Meeting</span>
              </Button>
            </div>

            <div className="space-y-2">
              {getMeetingsForDay(currentDate).length === 0 ? (
                <div className="text-center py-12 text-[#737373] bg-[#141414] rounded-xl border border-[#303030]">
                  <p className="text-xs">No meetings scheduled for this day.</p>
                </div>
              ) : (
                getMeetingsForDay(currentDate).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onOpenDetails(m)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#202020] hover:bg-[#2C2C2C] border border-[#303030] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#F5F5F5] text-xs">{m.title}</span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            getStatusColorClass(m.status)
                          )}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#A3A3A3] flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#8B5CF6]" />
                          {format(new Date(m.startTime), "h:mm a")} –{" "}
                          {format(new Date(m.endTime), "h:mm a")}
                        </span>
                        {m.location && <span>• {m.location}</span>}
                      </div>
                    </div>

                    {m.meetingUrl && (
                      <a
                        href={m.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-[#262626] text-[#8B5CF6] hover:bg-[#303030] border border-[#303030]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Agenda View */}
        {mode === "agenda" && (
          <div className="max-w-3xl mx-auto space-y-3">
            {meetings.length === 0 ? (
              <div className="text-center py-12 text-[#737373] bg-[#141414] rounded-xl border border-[#303030]">
                <p className="text-xs">No meetings found.</p>
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onOpenDetails(m)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#202020] hover:bg-[#2C2C2C] border border-[#303030] cursor-pointer gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-[#F5F5F5] text-xs">{m.title}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          getStatusColorClass(m.status)
                        )}
                      >
                        {m.status}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#181818] border border-[#303030] text-[#A3A3A3] capitalize">
                        {m.meetingType.toLowerCase()}
                      </span>
                    </div>

                    <div className="text-xs text-[#A3A3A3] flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-[#F5F5F5]">
                        <Clock className="h-3 w-3 text-[#8B5CF6]" />
                        {format(new Date(m.startTime), "EEE, MMM d • h:mm a")} –{" "}
                        {format(new Date(m.endTime), "h:mm a")}
                      </span>
                      {m.location && <span>• {m.location}</span>}
                      {(m.attendeeCount ?? 0) > 0 && (
                        <span>• {m.attendeeCount} participant(s)</span>
                      )}
                    </div>
                  </div>

                  {m.meetingType === "ONLINE" && m.meetingUrl && (
                    <a
                      href={m.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#303030] text-[#8B5CF6] border border-[#303030] text-xs font-medium shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Join Call</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
