"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Bell,
  Calendar,
  FolderOpen,
  Share2,
  AlertCircle,
} from "lucide-react";

interface DashboardWelcomeBannerProps {
  userName: string;
  greetingTime: string;
  formattedDate: string;
  todayTasksCount: number;
  overdueTasksCount: number;
  todayMeetingsCount: number;
}

export function DashboardWelcomeBanner({
  userName,
  greetingTime,
  formattedDate,
  todayTasksCount,
  overdueTasksCount,
  todayMeetingsCount,
}: DashboardWelcomeBannerProps) {
  return (
    <div className="rounded-xl border border-[#292929] bg-[#181818] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting, Date & Briefing */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
              {greetingTime}, {userName}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#262626] border border-[#383838] px-2.5 py-0.5 text-xs font-medium text-[#A3A3A3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A3A3A3]" />
              Active System
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#737373] max-w-2xl leading-relaxed">
            Welcome to your personal command centre. Here is your daily productivity briefing and operational overview.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#737373]">
            <span className="flex items-center gap-1.5 font-medium text-[#F5F5F5]">
              <CalendarIcon className="h-3.5 w-3.5 text-[#A3A3A3]" />
              {formattedDate}
            </span>
            <span className="text-[#303030]">•</span>
            <span className="flex items-center gap-1.5 font-medium text-[#A3A3A3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A3A3A3]" />
              {todayTasksCount} task{todayTasksCount === 1 ? "" : "s"} due today
            </span>

            {overdueTasksCount > 0 && (
              <>
                <span className="text-[#303030]">•</span>
                <span className="flex items-center gap-1.5 font-medium text-[#EF4444] bg-[#2A1818] border border-[#4A2020] px-2 py-0.5 rounded-full text-[11px]">
                  <AlertCircle className="h-3 w-3 text-[#EF4444]" />
                  {overdueTasksCount} overdue
                </span>
              </>
            )}

            <span className="text-[#303030]">•</span>
            <span className="flex items-center gap-1.5 font-medium text-[#A3A3A3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#737373]" />
              {todayMeetingsCount} meeting{todayMeetingsCount === 1 ? "" : "s"} today
            </span>
          </div>
        </div>

        {/* Right Column: Quick Action Shortcuts */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2">
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            <Link
              href="/tasks"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#292929] bg-[#202020] px-3 py-2 text-center transition-all hover:bg-[#262626] hover:border-[#383838] group"
              title="Create a new task"
            >
              <CheckSquare className="h-4 w-4 text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors" />
              <span className="text-[11px] font-medium text-[#737373] group-hover:text-[#F5F5F5]">
                New Task
              </span>
            </Link>

            <Link
              href="/notes"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#292929] bg-[#202020] px-3 py-2 text-center transition-all hover:bg-[#262626] hover:border-[#383838] group"
              title="Take a note"
            >
              <FileText className="h-4 w-4 text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors" />
              <span className="text-[11px] font-medium text-[#737373] group-hover:text-[#F5F5F5]">
                Take Note
              </span>
            </Link>

            <Link
              href="/reminders"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#292929] bg-[#202020] px-3 py-2 text-center transition-all hover:bg-[#262626] hover:border-[#383838] group"
              title="Add a reminder"
            >
              <Bell className="h-4 w-4 text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors" />
              <span className="text-[11px] font-medium text-[#737373] group-hover:text-[#F5F5F5]">
                Reminder
              </span>
            </Link>

            <Link
              href="/meetings"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#292929] bg-[#202020] px-3 py-2 text-center transition-all hover:bg-[#262626] hover:border-[#383838] group"
              title="Schedule a meeting"
            >
              <Calendar className="h-4 w-4 text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors" />
              <span className="text-[11px] font-medium text-[#737373] group-hover:text-[#F5F5F5]">
                Meeting
              </span>
            </Link>

            <Link
              href="/files"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#292929] bg-[#202020] px-3 py-2 text-center transition-all hover:bg-[#262626] hover:border-[#383838] group"
              title="Upload file to repository"
            >
              <FolderOpen className="h-4 w-4 text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors" />
              <span className="text-[11px] font-medium text-[#737373] group-hover:text-[#F5F5F5]">
                Upload File
              </span>
            </Link>

            <Link
              href="/social"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#292929] bg-[#202020] px-3 py-2 text-center transition-all hover:bg-[#262626] hover:border-[#383838] group"
              title="Plan a social post"
            >
              <Share2 className="h-4 w-4 text-[#A3A3A3] group-hover:text-[#F5F5F5] transition-colors" />
              <span className="text-[11px] font-medium text-[#737373] group-hover:text-[#F5F5F5]">
                Plan Post
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
