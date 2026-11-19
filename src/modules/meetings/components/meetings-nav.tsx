"use client";

import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  CalendarCheck,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
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
      id: "overview" as MeetingSection,
      label: "Overview",
      icon: LayoutDashboard,
      count: undefined,
    },
    {
      id: "calendar" as MeetingSection,
      label: "Calendar",
      icon: CalendarDays,
      count: undefined,
    },
    {
      id: "all" as MeetingSection,
      label: "All Meetings",
      icon: Calendar,
      count: stats?.total ?? 0,
    },
    {
      id: "upcoming" as MeetingSection,
      label: "Upcoming",
      icon: CalendarCheck,
      count: stats?.upcoming ?? 0,
      accentColor: "text-blue-400",
    },
    {
      id: "in-progress" as MeetingSection,
      label: "In Progress",
      icon: PlayCircle,
      count: stats?.inProgress ?? 0,
      accentColor: "text-emerald-400",
    },
    {
      id: "completed" as MeetingSection,
      label: "Completed",
      icon: CheckCircle2,
      count: stats?.completed ?? 0,
      accentColor: "text-green-400",
    },
    {
      id: "cancelled" as MeetingSection,
      label: "Cancelled",
      icon: XCircle,
      count: stats?.cancelled ?? 0,
      accentColor: "text-red-400",
    },
  ];

  return (
    <aside className="w-64 border-r border-[#303030] bg-[#141414] p-4 flex flex-col gap-6 select-none shrink-0">
      {/* Primary Action Button */}
      <div>
        <Button
          onClick={onOpenCreate}
          className="w-full justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium shadow-none border border-[#8B5CF6]/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Meeting</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-[#737373] tracking-wider uppercase mb-2">
          Meeting Views
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
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group",
                  isActive
                    ? "bg-[#262626] text-[#F5F5F5] border border-[#8B5CF6]/40"
                    : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020] border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-[#8B5CF6]"
                        : item.accentColor
                        ? item.accentColor
                        : "text-[#737373] group-hover:text-[#F5F5F5]"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums shrink-0 ml-2",
                      isActive
                        ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                        : "bg-[#202020] text-[#A3A3A3] border border-[#303030]"
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

      {/* High Priority Alert Box */}
      {stats && stats.highPriorityCount > 0 && (
        <div className="mt-auto p-3 rounded-lg bg-[#202020] border border-red-500/30 text-xs">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>High Priority</span>
            <span className="ml-auto bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded-full font-bold text-[11px]">
              {stats.highPriorityCount}
            </span>
          </div>
          <p className="text-[#A3A3A3] text-[11px] leading-tight">
            Meetings requiring urgent focus and preparation.
          </p>
        </div>
      )}
    </aside>
  );
}
