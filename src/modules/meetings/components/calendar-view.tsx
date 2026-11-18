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
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30";
      case "SCHEDULED":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30";
      case "COMPLETED":
        return "bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30";
      case "CANCELLED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 line-through opacity-70";
      case "RESCHEDULED":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30";
      case "NO_SHOW":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30";
      default:
        return "bg-primary/20 text-primary border-primary/40";
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
    <div className="flex flex-col h-full bg-[#080D16]">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-border/40 bg-[#0A101D]/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 text-xs font-semibold px-2.5"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-base font-bold text-foreground">
            {mode === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
            {mode === "week" &&
              `Week of ${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`}
            {mode === "month" && format(currentDate, "MMMM yyyy")}
            {mode === "agenda" && `Upcoming Agenda (${format(currentDate, "MMMM yyyy")})`}
          </h2>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center p-0.5 rounded-lg bg-card/60 border border-border/60 text-xs">
          {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                mode === v
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-secondary-text hover:text-foreground"
              }`}
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
          <div className="grid grid-cols-7 border border-border/40 rounded-xl overflow-hidden bg-card/30">
            {/* Weekday headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                className="p-2 text-center text-xs font-semibold text-secondary-text uppercase tracking-wider bg-card/60 border-b border-border/40"
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
                  className={`min-h-[105px] p-2 border-b border-r border-border/30 transition-colors flex flex-col justify-between group relative cursor-pointer hover:bg-card/40 ${
                    !isCurrentMonth ? "opacity-35 bg-card/10" : "bg-card/20"
                  } ${isCurrentDay ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full ${
                        isCurrentDay
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-secondary-text"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCreateWithDate(day);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-secondary-text hover:text-foreground p-0.5 rounded transition-opacity"
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
                        className={`px-1.5 py-0.5 rounded text-[11px] font-medium border truncate transition-all ${getStatusColorClass(
                          m.status
                        )}`}
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
                  className={`flex flex-col rounded-xl border p-3 bg-card/30 ${
                    isCurrentDay
                      ? "border-primary/50 shadow-sm shadow-primary/10"
                      : "border-border/40"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/40">
                    <div>
                      <div className="text-xs uppercase font-semibold text-secondary-text">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={`text-base font-bold ${
                          isCurrentDay ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {format(day, "MMM d")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenCreateWithDate(day)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayMeetings.length === 0 ? (
                      <p className="text-[11px] text-secondary-text italic text-center py-4">
                        No meetings
                      </p>
                    ) : (
                      dayMeetings.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => onOpenDetails(m)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${getStatusColorClass(
                            m.status
                          )}`}
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
            <div className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/60">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {format(currentDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <p className="text-xs text-secondary-text">
                  {getMeetingsForDay(currentDate).length} meeting(s) scheduled for this day
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onOpenCreateWithDate(currentDate)}
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule Meeting</span>
              </Button>
            </div>

            <div className="space-y-2">
              {getMeetingsForDay(currentDate).length === 0 ? (
                <div className="text-center py-12 text-secondary-text">
                  <p className="text-sm">No meetings scheduled for this day.</p>
                </div>
              ) : (
                getMeetingsForDay(currentDate).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onOpenDetails(m)}
                    className="flex items-center justify-between p-4 rounded-xl bg-card/50 hover:bg-card/80 border border-border/60 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-sm">{m.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColorClass(
                            m.status
                          )}`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <div className="text-xs text-secondary-text flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" />
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
                        className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                      >
                        <ExternalLink className="h-4 w-4" />
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
          <div className="max-w-3xl mx-auto space-y-4">
            {meetings.length === 0 ? (
              <div className="text-center py-12 text-secondary-text">
                <p className="text-sm">No meetings found.</p>
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onOpenDetails(m)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-card/40 hover:bg-card/70 border border-border/60 cursor-pointer gap-3 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-foreground text-sm">{m.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColorClass(
                          m.status
                        )}`}
                      >
                        {m.status}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-text">
                        {m.meetingType}
                      </span>
                    </div>

                    <div className="text-xs text-secondary-text flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <Clock className="h-3.5 w-3.5 text-primary" />
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold shrink-0"
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
