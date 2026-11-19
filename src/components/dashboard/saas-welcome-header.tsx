"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Plus,
  Calendar,
  Share2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaasWelcomeHeaderProps {
  userName: string;
  greetingTime: string;
  formattedDate: string;
  todayTasksCount: number;
  upcomingMeetingsCount: number;
}

export function SaasWelcomeHeader({
  userName,
  greetingTime,
  formattedDate,
  todayTasksCount,
  upcomingMeetingsCount,
}: SaasWelcomeHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-saas">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Dynamic Greeting & Real-time Date */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-text">
              {greetingTime}, {userName}!
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Optimal Rhythm
            </span>
          </div>

          <p className="text-xs sm:text-sm text-secondary-text">
            Here is your personal productivity overview and active command schedule.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-secondary-text">
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              {formattedDate}
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {todayTasksCount} task{todayTasksCount === 1 ? "" : "s"} due today
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              {upcomingMeetingsCount} upcoming meeting{upcomingMeetingsCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Right: Modern SaaS Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/tasks">
            <Button size="sm" className="gap-1.5 shadow-saas">
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </Button>
          </Link>

          <Link href="/meetings">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Schedule</span>
            </Button>
          </Link>

          <Link href="/notes">
            <Button size="sm" variant="outline" className="gap-1.5">
              <FileText className="h-3.5 w-3.5 text-secondary" />
              <span>Take Note</span>
            </Button>
          </Link>

          <Link href="/social">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-warning" />
              <span>Plan Post</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
