"use client";

import React from "react";
import {
  Search,
  ArrowUpDown,
  RefreshCw,
  LayoutList,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReminderPriority, ReminderStatus } from "../types";

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
    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card">
      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
        <Input
          placeholder="Search reminders..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-xs bg-sidebar border-border/80"
        />
      </div>

      {/* Filter selectors */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as ReminderPriority | "ALL")}
          className="flex h-9 rounded-md border border-input bg-[#0A101C] px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="flex h-9 rounded-md border border-input bg-[#0A101C] px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="flex h-9 rounded-md border border-input bg-[#0A101C] px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Types</option>
          <option value="ONE_TIME">One-time</option>
          <option value="RECURRING">Recurring</option>
        </select>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as "dueAt" | "priority" | "createdAt" | "title")}
          className="flex h-9 rounded-md border border-input bg-[#0A101C] px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="h-9 px-2.5 bg-sidebar border-border/80 text-secondary-text hover:text-foreground"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span className="text-[10px] ml-1 uppercase">{sortOrder}</span>
        </Button>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-border/80 bg-sidebar p-0.5">
          <button
            onClick={() => onViewModeChange("timeline")}
            title="Grouped Timeline View"
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === "timeline"
                ? "bg-primary/20 text-primary"
                : "text-secondary-text hover:text-foreground"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange("flat")}
            title="Compact List View"
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === "flat"
                ? "bg-primary/20 text-primary"
                : "text-secondary-text hover:text-foreground"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-9 px-2 text-secondary-text hover:text-foreground"
          title="Refresh Reminders"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
