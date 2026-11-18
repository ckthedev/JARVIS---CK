"use client";

import React from "react";
import Link from "next/link";
import { CheckSquare, Calendar, Bell, Share2, ArrowUpRight } from "lucide-react";
import { AreaWaveSparkline } from "./jarvis-dashboard-charts";

interface JarvisTopStatCardsProps {
  taskStats: {
    totalActive: number;
    today: number;
    upcoming: number;
    overdue: number;
    inProgress: number;
    todo: number;
    critical: number;
  };
  upcomingMeetingsCount: number;
  nextMeetingTime?: string | null;
  reminderStats: {
    total: number;
    today: number;
    upcoming: number;
    completed: number;
    overdue: number;
  };
  socialStats: {
    total: number;
    scheduled: number;
    drafts: number;
    published: number;
  };
}

export function JarvisTopStatCards({
  taskStats,
  upcomingMeetingsCount,
  nextMeetingTime,
  reminderStats,
  socialStats,
}: JarvisTopStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. TASKS VELOCITY CARD */}
      <Link href="/tasks" className="block focus:outline-none group">
        <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group-hover:border-primary/50 transition-all h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-foreground">
                  Tasks Velocity
                </span>
                <span className="block text-[10px] text-secondary-text font-mono">
                  {taskStats.today} due today &bull; {taskStats.overdue} overdue
                </span>
              </div>
            </div>
            <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
              Live
            </span>
          </div>

          {/* Large Metric & Delta Badge */}
          <div className="flex items-baseline gap-2.5 my-1 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {taskStats.totalActive} <span className="text-xs font-medium text-secondary-text uppercase">active</span>
            </span>
            <span className="flex items-center gap-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>{taskStats.inProgress} in progress</span>
            </span>
          </div>

          {/* Sub-Metrics */}
          <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
            <span>Critical: {taskStats.critical}</span>
            <span>Todo: {taskStats.todo}</span>
            <span>Overdue: {taskStats.overdue}</span>
          </div>

          {/* Glowing Area Wave Chart */}
          <div className="-mx-4 -mb-4 pt-1">
            <AreaWaveSparkline
              color="emerald"
              dataPoints={[10, 15, 12, 18, 22, 19, 25, 28, 24, 30, Math.max(10, taskStats.totalActive)]}
              height={50}
            />
          </div>
        </div>
      </Link>

      {/* 2. MEETINGS PIPELINE CARD */}
      <Link href="/meetings" className="block focus:outline-none group">
        <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group-hover:border-cyan-500/50 transition-all h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-foreground">
                  Meeting Pipeline
                </span>
                <span className="block text-[10px] text-secondary-text font-mono">
                  Upcoming synchronizations
                </span>
              </div>
            </div>
            <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
              Agenda
            </span>
          </div>

          {/* Large Metric & Delta Badge */}
          <div className="flex items-baseline gap-2.5 my-1 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {upcomingMeetingsCount} <span className="text-xs font-medium text-secondary-text uppercase">upcoming</span>
            </span>
            <span className="flex items-center gap-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">
              <span>Next: {nextMeetingTime || "None today"}</span>
            </span>
          </div>

          {/* Sub-Metrics */}
          <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
            <span>Online & In-person</span>
            <span>Auto Reminders Synced</span>
          </div>

          {/* Glowing Area Wave Chart */}
          <div className="-mx-4 -mb-4 pt-1">
            <AreaWaveSparkline
              color="cyan"
              dataPoints={[5, 8, 12, 7, 14, 11, 16, 12, 18, Math.max(5, upcomingMeetingsCount * 4)]}
              height={50}
            />
          </div>
        </div>
      </Link>

      {/* 3. ACTIVE REMINDERS CARD */}
      <Link href="/reminders" className="block focus:outline-none group">
        <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group-hover:border-amber-500/50 transition-all h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-foreground">
                  Active Reminders
                </span>
                <span className="block text-[10px] text-secondary-text font-mono">
                  Dispatch queue active
                </span>
              </div>
            </div>
            <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
              pg-boss
            </span>
          </div>

          {/* Large Metric & Delta Badge */}
          <div className="flex items-baseline gap-2.5 my-1 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {reminderStats.today + reminderStats.upcoming} <span className="text-xs font-medium text-secondary-text uppercase">pending</span>
            </span>
            <span className="flex items-center gap-0.5 rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              <span>{reminderStats.overdue > 0 ? `${reminderStats.overdue} Alert` : "Synced"}</span>
            </span>
          </div>

          {/* Sub-Metrics */}
          <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
            <span>Total: {reminderStats.total}</span>
            <span>Completed: {reminderStats.completed}</span>
          </div>

          {/* Glowing Area Wave Chart */}
          <div className="-mx-4 -mb-4 pt-1">
            <AreaWaveSparkline
              color="amber"
              dataPoints={[12, 14, 18, 16, 22, 20, 24, 28, Math.max(8, (reminderStats.today + reminderStats.upcoming) * 3)]}
              height={50}
            />
          </div>
        </div>
      </Link>

      {/* 4. SOCIAL MEDIA PIPELINE CARD */}
      <Link href="/social" className="block focus:outline-none group">
        <div className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm relative hud-brackets flex flex-col justify-between overflow-hidden group-hover:border-purple-500/50 transition-all h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-foreground">
                  Social Queue
                </span>
                <span className="block text-[10px] text-secondary-text font-mono">
                  Multi-channel planned
                </span>
              </div>
            </div>
            <span className="rounded bg-muted/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-mono text-secondary-text">
              Planner
            </span>
          </div>

          {/* Large Metric & Delta Badge */}
          <div className="flex items-baseline gap-2.5 my-1 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {socialStats.scheduled} <span className="text-xs font-medium text-secondary-text uppercase">scheduled</span>
            </span>
            <span className="flex items-center gap-0.5 rounded bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">
              <span>{socialStats.published} published</span>
            </span>
          </div>

          {/* Sub-Metrics */}
          <div className="flex items-center justify-between text-[10px] font-mono text-secondary-text mb-2">
            <span>Drafts: {socialStats.drafts}</span>
            <span>Total: {socialStats.total}</span>
          </div>

          {/* Glowing Area Wave Chart */}
          <div className="-mx-4 -mb-4 pt-1">
            <AreaWaveSparkline
              color="purple"
              dataPoints={[8, 12, 10, 16, 14, 20, 18, 25, Math.max(6, socialStats.scheduled * 4)]}
              height={50}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
