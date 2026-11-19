"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  CheckSquare,
  FileText,
  FolderOpen,
  Calendar,
  Bell,
  Share2,
} from "lucide-react";
import { ActivityTimelineItem } from "@/modules/analytics/service";

interface DashboardRecentActivityProps {
  activityTimeline: ActivityTimelineItem[];
}

export function DashboardRecentActivity({
  activityTimeline,
}: DashboardRecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TASK":
        return <CheckSquare className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "MEETING":
        return <Calendar className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "NOTE":
        return <FileText className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "FILE":
        return <FolderOpen className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "REMINDER":
        return <Bell className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      case "SOCIAL":
        return <Share2 className="h-3.5 w-3.5 text-[#A3A3A3]" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-[#737373]" />;
    }
  };

  const formatRelativeTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return `${Math.floor(diffSecs / 86400)}d ago`;
  };

  return (
    <div className="rounded-xl border border-[#303030] bg-[#202020] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#292929]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#A3A3A3]" />
          <h2 className="text-base font-semibold text-[#F5F5F5]">
            Recent Activity
          </h2>
        </div>
        <span className="text-[11px] text-[#737373]">Cross-Module Log</span>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-3.5 space-y-2">
        {activityTimeline.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#737373]">
            No recent activity recorded. Start working to generate an activity log.
          </div>
        ) : (
          activityTimeline.slice(0, 6).map((item) => (
            <Link
              key={item.id}
              href={item.href || "/dashboard"}
              className="group flex items-start justify-between gap-3 rounded-lg border border-[#292929] bg-[#181818] p-2.5 transition-all hover:bg-[#242424] hover:border-[#383838]"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#303030] bg-[#202020]">
                  {getActivityIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#F5F5F5] group-hover:text-white transition-colors truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] truncate mt-0.5">
                    {item.detail}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                <span className="text-[10px] text-[#737373]">
                  {formatRelativeTime(item.timestamp)}
                </span>
                {item.statusBadge && (
                  <span className="rounded bg-[#202020] border border-[#303030] px-1.5 py-0.2 text-[9px] font-mono text-[#A3A3A3]">
                    {item.statusBadge}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
