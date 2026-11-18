"use client";

import React from "react";
import { Search, X, List, CalendarDays, ArrowUpDown } from "lucide-react";
import {
  MeetingType,
  MeetingPriority,
  MeetingStatus,
  MeetingFilters,
} from "../types";
import { Button } from "@/components/ui/button";

interface MeetingsToolbarProps {
  filters: MeetingFilters;
  onFilterChange: (filters: Partial<MeetingFilters>) => void;
  viewMode: "list" | "calendar";
  onViewModeChange: (mode: "list" | "calendar") => void;
}

export function MeetingsToolbar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
}: MeetingsToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 border-b border-border/40 bg-[#0A101D]/40 backdrop-blur-sm">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
        <input
          type="text"
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search by title, location, agenda, participant..."
          className="w-full pl-9 pr-8 py-2 rounded-lg bg-card/60 border border-border/60 text-sm text-foreground placeholder:text-secondary-text/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/80 transition-all"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ search: "" })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns & View Mode */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type Filter */}
        <select
          value={filters.meetingType || ""}
          onChange={(e) =>
            onFilterChange({
              meetingType: (e.target.value as MeetingType) || undefined,
            })
          }
          className="px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="ONLINE">Online</option>
          <option value="PHYSICAL">Physical</option>
          <option value="PHONE">Phone</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || ""}
          onChange={(e) =>
            onFilterChange({
              priority: (e.target.value as MeetingPriority) || undefined,
            })
          }
          className="px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="NORMAL">Normal Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ""}
          onChange={(e) =>
            onFilterChange({
              status: (e.target.value as MeetingStatus) || undefined,
            })
          }
          className="px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="NO_SHOW">No Show</option>
        </select>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/40 border border-border/60">
          <ArrowUpDown className="h-3.5 w-3.5 text-secondary-text" />
          <select
            value={`${filters.sortBy || "startTime"}-${filters.sortOrder || "asc"}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-") as [
                "startTime" | "title" | "priority" | "createdAt",
                "asc" | "desc"
              ];
              onFilterChange({ sortBy, sortOrder });
            }}
            className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="startTime-asc">Soonest First</option>
            <option value="startTime-desc">Latest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="priority-desc">Priority</option>
            <option value="createdAt-desc">Recently Created</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-card/60 border border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("list")}
            className={`h-8 px-2.5 gap-1.5 text-xs rounded-md ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
                : "text-secondary-text hover:text-foreground hover:bg-transparent"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("calendar")}
            className={`h-8 px-2.5 gap-1.5 text-xs rounded-md ${
              viewMode === "calendar"
                ? "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
                : "text-secondary-text hover:text-foreground hover:bg-transparent"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
