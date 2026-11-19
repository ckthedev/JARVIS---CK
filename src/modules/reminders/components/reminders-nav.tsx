"use client";

import React from "react";
import {
  LayoutDashboard,
  Bell,
  Sun,
  Calendar,
  AlertTriangle,
  Repeat,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReminderSection, ReminderStats } from "../types";
import { Button } from "@/components/ui/button";

interface RemindersNavProps {
  currentSection: ReminderSection;
  onSelectSection: (section: ReminderSection) => void;
  onOpenCreate: () => void;
  stats?: ReminderStats;
}

export function RemindersNav({
  currentSection,
  onSelectSection,
  onOpenCreate,
  stats,
}: RemindersNavProps) {
  const navItems = [
    {
      id: "overview" as ReminderSection,
      label: "Overview",
      icon: LayoutDashboard,
      count: undefined,
    },
    {
      id: "all" as ReminderSection,
      label: "All Reminders",
      icon: Bell,
      count: stats?.total ?? 0,
    },
    {
      id: "today" as ReminderSection,
      label: "Today",
      icon: Sun,
      count: stats?.today ?? 0,
      accentColor: "text-amber-400",
    },
    {
      id: "upcoming" as ReminderSection,
      label: "Upcoming",
      icon: Calendar,
      count: stats?.upcoming ?? 0,
      accentColor: "text-blue-400",
    },
    {
      id: "overdue" as ReminderSection,
      label: "Overdue",
      icon: AlertTriangle,
      count: stats?.overdue ?? 0,
      accentColor: "text-red-400",
    },
    {
      id: "recurring" as ReminderSection,
      label: "Recurring",
      icon: Repeat,
      count: stats?.recurring ?? 0,
      accentColor: "text-purple-400",
    },
    {
      id: "completed" as ReminderSection,
      label: "Completed",
      icon: CheckCircle2,
      count: stats?.completed ?? 0,
      accentColor: "text-green-400",
    },
  ];

  return (
    <aside className="w-full lg:w-64 border border-[#303030] rounded-xl bg-[#141414] p-4 flex flex-col gap-5 select-none shrink-0">
      {/* Primary Action Button */}
      <div>
        <Button
          onClick={onOpenCreate}
          className="w-full justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium shadow-none border border-[#8B5CF6]/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Reminder</span>
        </Button>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-[#737373] tracking-wider uppercase mb-2">
          Reminder Views
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

      {/* Overdue Alert Box */}
      {stats && stats.overdue > 0 && (
        <div className="mt-auto p-3 rounded-lg bg-[#202020] border border-red-500/30 text-xs">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Overdue Alerts</span>
            <span className="ml-auto bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded-full font-bold text-[11px]">
              {stats.overdue}
            </span>
          </div>
          <p className="text-[#A3A3A3] text-[11px] leading-tight">
            Reminders past their scheduled time requiring resolution.
          </p>
        </div>
      )}
    </aside>
  );
}
