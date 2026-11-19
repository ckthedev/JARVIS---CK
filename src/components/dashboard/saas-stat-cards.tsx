"use client";

import React from "react";
import Link from "next/link";
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Bell,
  FileText,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { DashboardTaskStats } from "@/modules/tasks/types";
import { DashboardNoteStats } from "@/modules/notes/types";
import { ReminderStats } from "@/modules/reminders/types";
import { SocialStats } from "@/modules/social/types";
import { SparklinePoint } from "@/modules/analytics/service";

interface SaasStatCardsProps {
  taskStats: DashboardTaskStats;
  upcomingMeetingsCount: number;
  reminderStats: ReminderStats;
  noteStats: DashboardNoteStats;
  socialStats: SocialStats;
  sparklines: {
    tasks: SparklinePoint[];
    completed: SparklinePoint[];
    pending: SparklinePoint[];
    overdue: SparklinePoint[];
    meetings: SparklinePoint[];
    reminders: SparklinePoint[];
    notes: SparklinePoint[];
    social: SparklinePoint[];
  };
}

export function SaasStatCards({
  taskStats,
  upcomingMeetingsCount,
  reminderStats,
  noteStats,
  socialStats,
  sparklines,
}: SaasStatCardsProps) {
  const totalTasks = taskStats.totalActive + taskStats.completed;
  const completionRate =
    totalTasks > 0 ? Math.round((taskStats.completed / totalTasks) * 100) : 0;

  const cards = [
    {
      id: "total-tasks",
      title: "Total Tasks",
      value: totalTasks,
      trend: `${taskStats.totalActive} active`,
      icon: CheckSquare,
      color: "#5546F5", // Primary Indigo
      iconBg: "bg-primary/10 text-primary",
      gradientId: "sparklineTotalTasks",
      data: sparklines.tasks,
      href: "/tasks",
    },
    {
      id: "completed-tasks",
      title: "Completed Tasks",
      value: taskStats.completed,
      trend: `${completionRate}% rate`,
      icon: CheckCircle2,
      color: "#18B981", // Success Green
      iconBg: "bg-success/10 text-success",
      gradientId: "sparklineCompletedTasks",
      data: sparklines.completed,
      href: "/tasks?status=COMPLETED",
    },
    {
      id: "pending-tasks",
      title: "Pending Tasks",
      value: taskStats.totalActive,
      trend: `${taskStats.today} due today`,
      icon: Clock,
      color: "#8B5CF6", // Secondary Violet
      iconBg: "bg-secondary/10 text-secondary",
      gradientId: "sparklinePendingTasks",
      data: sparklines.pending,
      href: "/tasks?status=IN_PROGRESS",
    },
    {
      id: "overdue-tasks",
      title: "Overdue Tasks",
      value: taskStats.overdue,
      trend: taskStats.overdue > 0 ? "Requires action" : "All on track",
      icon: AlertCircle,
      color: "#EF5470", // Danger Rose
      iconBg: "bg-danger/10 text-danger",
      gradientId: "sparklineOverdueTasks",
      data: sparklines.overdue,
      href: "/tasks?view=overdue",
    },
    {
      id: "upcoming-meetings",
      title: "Upcoming Meetings",
      value: upcomingMeetingsCount,
      trend: "Scheduled",
      icon: Calendar,
      color: "#5546F5",
      iconBg: "bg-primary/10 text-primary",
      gradientId: "sparklineMeetings",
      data: sparklines.meetings,
      href: "/meetings",
    },
    {
      id: "active-reminders",
      title: "Active Reminders",
      value: reminderStats.upcoming,
      trend: `${reminderStats.total} total alerts`,
      icon: Bell,
      color: "#F5A623", // Warning Amber
      iconBg: "bg-warning/10 text-warning",
      gradientId: "sparklineReminders",
      data: sparklines.reminders,
      href: "/reminders",
    },
    {
      id: "total-notes",
      title: "Total Notes",
      value: noteStats.totalActive,
      trend: `${noteStats.pinned} pinned`,
      icon: FileText,
      color: "#8B5CF6",
      iconBg: "bg-secondary/10 text-secondary",
      gradientId: "sparklineNotes",
      data: sparklines.notes,
      href: "/notes",
    },
    {
      id: "planned-posts",
      title: "Planned Social Posts",
      value: socialStats.scheduled,
      trend: `${socialStats.drafts} drafts`,
      icon: Share2,
      color: "#5546F5",
      iconBg: "bg-primary/10 text-primary",
      gradientId: "sparklineSocial",
      data: sparklines.social,
      href: "/social",
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
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-saas transition-all hover:border-primary/40 hover:shadow-cardHover"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
                  {card.title}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${card.iconBg}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-primary-text tabular-nums">
                  {card.value}
                </span>
                <span className="text-[11px] font-semibold text-secondary-text rounded-full bg-muted px-2 py-0.5 border border-border">
                  {card.trend}
                </span>
              </div>
            </div>

            {/* Sparkline Wave */}
            <div className="h-10 w-full mt-3 -mb-1 overflow-hidden opacity-85 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={card.data}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id={card.gradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={card.color}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={card.color}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke={card.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${card.gradientId})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
