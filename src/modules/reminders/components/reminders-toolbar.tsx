"use client";

import React from "react";
import {
  Search,
  ArrowUpDown,
  RefreshCw,
  LayoutList,
  CalendarDays,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderPriority, ReminderStatus } from "../types";
import { cn } from "@/lib/utils";

interface RemindersToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  priorityFilter?: ReminderPriority | "ALL";
  onPriorityChange: (val: ReminderPriority | "ALL") => void;
  statusFilter?: ReminderStatus | "ALL";
  onStatusChange: (val: ReminderStatus | "ALL") => void;
  recurrenceFilter: "ALL" | "RECURRING" | "ONE_TIME";
  onRecurrenceChange: (val: "ALL" | "RECURRING" | "ONE_TIME") => void;
  sortBy: "dueAt" | "priority" | "createdAt" | "title";
  onSortByChange: (val: "dueAt" | "priority" | "createdAt" | "title") => void;
  sortOrder: "asc" | "desc";
  onToggleSortOrder: () => void;
  viewMode: "timeline" | "flat";
  onViewModeChange: (val: "timeline" | "flat") => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function RemindersToolbar({
  search,
  onSearchChange,
  priorityFilter = "ALL",
  onPriorityChange,
  statusFilter = "ALL",
  onStatusChange,
  recurrenceFilter,
  onRecurrenceChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  viewMode,
  onViewModeChange,
  onRefresh,
  loading = false,
}: RemindersToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[#303030] bg-[#141414]">
      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
        <input
          placeholder="Search reminders..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5]"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter selectors */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as ReminderPriority | "ALL")}
          className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
        >
          <option value="ALL">All Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as ReminderStatus | "ALL")}
          className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="SNOOZED">Snoozed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Recurrence Filter */}
        <select
          value={recurrenceFilter}
          onChange={(e) => onRecurrenceChange(e.target.value as "ALL" | "RECURRING" | "ONE_TIME")}
          className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
        >
          <option value="ALL">All Types</option>
          <option value="ONE_TIME">One-time</option>
          <option value="RECURRING">Recurring</option>
        </select>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as "dueAt" | "priority" | "createdAt" | "title")}
          className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
        >
          <option value="dueAt">Due Date</option>
          <option value="priority">Priority</option>
          <option value="createdAt">Created</option>
          <option value="title">Title</option>
        </select>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSortOrder}
          title={`Order: ${sortOrder.toUpperCase()}`}
          className="h-8 px-2.5 bg-[#181818] border-[#303030] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
        >
          <ArrowUpDown className="h-3 w-3" />
          <span className="text-[10px] ml-1 uppercase">{sortOrder}</span>
        </Button>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-[#303030] bg-[#181818] p-0.5">
          <button
            onClick={() => onViewModeChange("timeline")}
            title="Grouped Timeline View"
            className={cn(
              "p-1.5 rounded text-xs transition-colors",
              viewMode === "timeline"
                ? "bg-[#262626] text-[#8B5CF6]"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("flat")}
            title="Flat List View"
            className={cn(
              "p-1.5 rounded text-xs transition-colors",
              viewMode === "flat"
                ? "bg-[#262626] text-[#8B5CF6]"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Reminders"
          className="h-8 w-8 p-0 bg-[#181818] border-[#303030] text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#202020]"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-[#8B5CF6]")} />
        </Button>
      </div>
    </div>
  );
}
