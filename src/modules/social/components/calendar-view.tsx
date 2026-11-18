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
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SocialPostDto,
  SocialCampaignDto,
} from "../types";
import { ALL_PLATFORMS, PlatformIcon, getPlatformMeta, PostStatusBadge } from "./social-badges";
import { cn } from "@/lib/utils";

type CalendarViewMode = "month" | "week" | "day" | "agenda";

interface SocialCalendarViewProps {
  posts: SocialPostDto[];
  campaigns?: SocialCampaignDto[];
  onSelectPost: (post: SocialPostDto) => void;
  onOpenCreateWithDate?: (date: Date) => void;
}

export function SocialCalendarView({
  posts,
  campaigns = [],
  onSelectPost,
  onOpenCreateWithDate,
}: SocialCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<CalendarViewMode>("month");

  // Filters
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const filteredPosts = posts.filter((post) => {
    if (!post.plannedAt) return false;

    if (platformFilter !== "all") {
      const hasPlatform = post.platforms?.some(
        (p) => p.platform === platformFilter
      );
      if (!hasPlatform) return false;
    }

    if (campaignFilter !== "all" && post.campaignId !== campaignFilter) {
      return false;
    }

    if (statusFilter !== "all" && post.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const getPostsForDay = (day: Date) => {
    return filteredPosts.filter((post) => {
      if (!post.plannedAt) return false;
      return isSameDay(new Date(post.plannedAt), day);
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Mode Switcher, Date Navigation & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.08] bg-[#0c1320]">
        {/* Date Nav */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs h-8"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-foreground ml-1">
            {mode === "day" && format(currentDate, "MMMM d, yyyy")}
            {mode === "week" &&
              `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} - ${format(
                endOfWeek(currentDate, { weekStartsOn: 1 }),
                "MMM d, yyyy"
              )}`}
            {mode === "month" && format(currentDate, "MMMM yyyy")}
            {mode === "agenda" && `Upcoming Content from ${format(currentDate, "MMM yyyy")}`}
          </h2>
        </div>

        {/* View Mode Buttons & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-card/60 p-1 rounded-lg border border-border/80">
            {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium capitalize transition-all",
                  mode === v
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
          >
            <option value="all">All Platforms</option>
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {getPlatformMeta(p).label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[110px]"
          >
            <option value="all">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
            <option value="IDEA">Idea</option>
            <option value="PUBLISHED">Published</option>
          </select>

          {/* Campaign Filter */}
          {campaigns.length > 0 && (
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-lg bg-card/60 border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* MONTH VIEW */}
      {mode === "month" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c1320] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/[0.08] bg-white/[0.02]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-white/[0.06]">
            {(() => {
              const monthStart = startOfMonth(currentDate);
              const monthEnd = endOfMonth(monthStart);
              const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
              const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
              const days = eachDayOfInterval({ start: startDate, end: endDate });

              return days.map((day) => {
                const dayPosts = getPostsForDay(day);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => onOpenCreateWithDate?.(day)}
                    className={cn(
                      "min-h-[115px] p-2 flex flex-col justify-between transition-colors cursor-pointer group",
                      !isCurrentMonth ? "bg-black/20 text-muted-foreground/40" : "bg-transparent",
                      isCurrentDay && "bg-primary/[0.03]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full transition-all",
                          isCurrentDay
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                            : isCurrentMonth
                            ? "text-foreground group-hover:text-primary"
                            : "text-muted-foreground/40"
                        )}
                      >
                        {format(day, "d")}
                      </span>

                      {dayPosts.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {dayPosts.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[85px]">
                      {dayPosts.map((post) => {
                        const firstPlatform = post.platforms?.[0]?.platform || "INSTAGRAM";
                        const time = post.plannedAt
                          ? format(new Date(post.plannedAt), "h:mm a")
                          : "";

                        return (
                          <div
                            key={post.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPost(post);
                            }}
                            className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] text-left transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <PlatformIcon platform={firstPlatform} className="h-3 w-3 shrink-0 text-primary" />
                            <span className="text-[11px] font-medium text-foreground truncate flex-1">
                              {post.title}
                            </span>
                            {time && (
                              <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                                {time}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {mode === "week" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c1320] overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-white/[0.06]">
            {(() => {
              const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
              const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
              const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

              return days.map((day) => {
                const dayPosts = getPostsForDay(day);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[380px] p-3 flex flex-col",
                      isCurrentDay ? "bg-primary/[0.04]" : "bg-transparent"
                    )}
                  >
                    <div className="text-center pb-2 border-b border-white/[0.06] mb-2">
                      <div className="text-[11px] font-medium text-muted-foreground uppercase">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={cn(
                          "text-base font-bold inline-flex items-center justify-center h-7 w-7 rounded-full mt-0.5",
                          isCurrentDay
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => onSelectPost(post)}
                          className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              {post.platforms?.map((p) => (
                                <PlatformIcon key={p.platform} platform={p.platform} className="h-3 w-3" />
                              ))}
                            </div>
                            <PostStatusBadge status={post.status} className="text-[9px] px-1 py-0" />
                          </div>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {post.title}
                          </p>
                          {post.plannedAt && (
                            <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {format(new Date(post.plannedAt), "h:mm a")} IST
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {mode === "day" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c1320] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {format(currentDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {getPostsForDay(currentDate).length} content post(s) scheduled for this day
              </p>
            </div>
            {onOpenCreateWithDate && (
              <Button
                size="sm"
                onClick={() => onOpenCreateWithDate(currentDate)}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Schedule for this day
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {getPostsForDay(currentDate).length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                No social media posts scheduled for this day.
              </div>
            ) : (
              getPostsForDay(currentDate).map((post) => (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">{post.title}</h4>
                      <PostStatusBadge status={post.status} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {post.content || post.description || "No caption"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-xs font-mono text-cyan-400 bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.06]">
                      {post.plannedAt ? format(new Date(post.plannedAt), "h:mm a") : ""} IST
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {mode === "agenda" && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0c1320] p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-white/[0.08] pb-2">
            Chronological Content Agenda
          </h3>
          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs">
                No planned social media posts found matching filters.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="p-3.5 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary uppercase">
                        {post.plannedAt ? format(new Date(post.plannedAt), "MMM") : ""}
                      </span>
                      <span className="text-xs font-extrabold text-foreground leading-none">
                        {post.plannedAt ? format(new Date(post.plannedAt), "d") : ""}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          {post.title}
                        </span>
                        <PostStatusBadge status={post.status} />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {post.content || post.description || "No caption"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 text-xs">
                    {post.platforms?.map((p) => (
                      <PlatformIcon key={p.platform} platform={p.platform} className="h-3.5 w-3.5" />
                    ))}
                    {post.plannedAt && (
                      <span className="font-mono text-cyan-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
                        {format(new Date(post.plannedAt), "h:mm a")} IST
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
