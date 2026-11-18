"use client";

import React from "react";
import {
  Calendar,
  Sun,
  CalendarCheck,
  CalendarDays,
  PlayCircle,
  CheckCircle2,
  XCircle,
  History,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MeetingSection, MeetingStats } from "../types";
import { Button } from "@/components/ui/button";

interface MeetingsNavProps {
  currentSection: MeetingSection;
  onSelectSection: (section: MeetingSection) => void;
  onOpenCreate: () => void;
  stats?: MeetingStats;
}

export function MeetingsNav({
  currentSection,
  onSelectSection,
  onOpenCreate,
  stats,
}: MeetingsNavProps) {
  const navItems = [
    {
      id: "all" as MeetingSection,
      label: "All Meetings",
      icon: Calendar,
      count: stats?.total ?? 0,
      badgeColor: "bg-primary/20 text-primary",
    },
    {
      id: "today" as MeetingSection,
      label: "Today",
      icon: Sun,
      count: stats?.today ?? 0,
      badgeColor: "bg-amber-400/20 text-amber-400",
    },
    {
      id: "upcoming" as MeetingSection,
      label: "Upcoming",
      icon: CalendarCheck,
      count: stats?.upcoming ?? 0,
      badgeColor: "bg-cyan-400/20 text-cyan-400",
    },
    {
      id: "calendar" as MeetingSection,
      label: "Calendar",
      icon: CalendarDays,
      badgeColor: "bg-purple-400/20 text-purple-400",
    },
    {
      id: "in-progress" as MeetingSection,
      label: "In Progress",
      icon: PlayCircle,
      count: stats?.inProgress ?? 0,
      badgeColor: "bg-emerald-400/20 text-emerald-400",
    },
    {
      id: "completed" as MeetingSection,
      label: "Completed",
      icon: CheckCircle2,
      count: stats?.completed ?? 0,
      badgeColor: "bg-emerald-400/20 text-emerald-400",
    },
    {
      id: "cancelled" as MeetingSection,
      label: "Cancelled",
      icon: XCircle,
      count: stats?.cancelled ?? 0,
      badgeColor: "bg-rose-400/20 text-rose-400",
    },
    {
      id: "past" as MeetingSection,
      label: "Past Meetings",
      icon: History,
      count: stats?.past ?? 0,
      badgeColor: "bg-gray-400/20 text-gray-400",
    },
  ];

  return (
    <aside className="w-64 border-r border-border/40 bg-[#0D1421]/60 p-4 flex flex-col gap-6 select-none shrink-0">
      <div>
        <Button
          onClick={onOpenCreate}
          className="w-full justify-center gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Meeting</span>
        </Button>
      </div>

      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-secondary-text tracking-wider uppercase mb-2">
          Views & Filters
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/25 shadow-sm"
                    : "text-secondary-text hover:text-foreground hover:bg-card/40 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-secondary-text group-hover:text-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold tabular-nums shrink-0 ml-2",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : item.badgeColor || "bg-card text-secondary-text"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {stats && stats.highPriorityCount > 0 && (
        <div className="mt-auto p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <span>High Priority</span>
            <span className="ml-auto bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded-full font-bold">
              {stats.highPriorityCount}
            </span>
          </div>
          <p className="text-secondary-text leading-tight">
            Meetings requiring urgent focus and preparation.
          </p>
        </div>
      )}
    </aside>
  );
}
