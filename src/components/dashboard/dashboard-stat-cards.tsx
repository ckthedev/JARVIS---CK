"use client";

import React from "react";
import Link from "next/link";
import {
  CheckSquare,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { DashboardTaskStats } from "@/modules/tasks/types";

interface DashboardStatCardsProps {
  taskStats: DashboardTaskStats;
  todayMeetingsCount: number;
  activeProjectsCount: number;
  nextMeetingTitle?: string | null;
}

export function DashboardStatCards({
  taskStats,
  todayMeetingsCount,
  activeProjectsCount,
  nextMeetingTitle,
}: DashboardStatCardsProps) {
  const totalTasks = taskStats.totalActive + taskStats.completed;
  const completionRate =
    totalTasks > 0 ? Math.round((taskStats.completed / totalTasks) * 100) : 0;

  const cards = [
    {
      id: "pending-tasks",
      title: "Pending Tasks",
      value: taskStats.totalActive,
      subtext: `${taskStats.today} due today • ${taskStats.overdue} overdue`,
      hasAlert: taskStats.overdue > 0,
      href: "/tasks",
      icon: CheckSquare,
    },
    {
      id: "completed-tasks",
      title: "Completed Tasks",
      value: taskStats.completed,
      subtext: `${completionRate}% overall completion rate`,
      hasAlert: false,
      href: "/tasks?view=completed",
      icon: CheckCircle2,
    },
    {
      id: "meetings-today",
      title: "Meetings Today",
      value: todayMeetingsCount,
      subtext: nextMeetingTitle ? `Next: ${nextMeetingTitle}` : "No more meetings today",
      hasAlert: false,
      href: "/meetings",
      icon: Calendar,
    },
    {
      id: "active-projects",
      title: "Active Projects",
      value: activeProjectsCount,
      subtext: "Across active task boards",
      hasAlert: false,
      href: "/tasks",
      icon: Layers,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            href={card.href}
            className="group relative flex flex-col justify-between rounded-xl border border-[#292929] bg-[#202020] p-4 sm:p-5 transition-all duration-150 hover:bg-[#242424] hover:border-[#383838] shadow-sm"
          >
            {/* Top row: Title and Icon */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#737373] group-hover:text-[#A3A3A3] transition-colors">
                {card.title}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#303030] bg-[#181818] text-[#A3A3A3] transition-transform group-hover:scale-105">
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Middle: Value & Metric */}
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5]">
                {card.value}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-[#737373] group-hover:text-[#A3A3A3] transition-colors">
                <span>View</span>
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>

            {/* Bottom: Subtext / Trend */}
            <div className="mt-2 flex items-center gap-1.5 pt-2 border-t border-[#292929] text-xs text-[#737373]">
              {card.hasAlert ? (
                <span className="flex items-center gap-1 text-[#EF4444] font-medium">
                  <AlertCircle className="h-3 w-3" />
                  {card.subtext}
                </span>
              ) : (
                <span className="truncate">{card.subtext}</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
