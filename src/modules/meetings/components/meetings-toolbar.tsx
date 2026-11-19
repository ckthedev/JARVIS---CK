"use client";

import React from "react";
import { Search, X, List, CalendarDays, ArrowUpDown } from "lucide-react";
import {
  MeetingType,
  MeetingPriority,
  MeetingStatus,
  MeetingFilters,
} from "../types";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 border-b border-[#303030] bg-[#141414]">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373]" />
        <input
          type="text"
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search by title, location, agenda, participant..."
          className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ search: "" })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5]"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns & View Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type Filter */}
        <select
          value={filters.meetingType || ""}
          onChange={(e) =>
            onFilterChange({
              meetingType: (e.target.value as MeetingType) || undefined,
            })
          }
          className="px-2.5 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
        >
          <option value="">All Types</option>
          <option value="ONLINE">Online</option>
          <option value="PHYSICAL">Physical</option>
          <option value="PHONE">Phone Call</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || ""}
          onChange={(e) =>
            onFilterChange({
              priority: (e.target.value as MeetingPriority) || undefined,
            })
          }
          className="px-2.5 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
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
          className="px-2.5 py-1.5 rounded-lg bg-[#181818] border border-[#303030] text-xs text-[#F5F5F5] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
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
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181818] border border-[#303030]">
          <ArrowUpDown className="h-3 w-3 text-[#737373]" />
          <select
            value={`${filters.sortBy || "startTime"}-${filters.sortOrder || "asc"}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-") as [
                "startTime" | "title" | "priority" | "createdAt",
                "asc" | "desc"
              ];
              onFilterChange({ sortBy, sortOrder });
            }}
            className="bg-transparent text-xs text-[#F5F5F5] focus:outline-none cursor-pointer"
          >
            <option value="startTime-asc" className="bg-[#181818] text-[#F5F5F5]">Soonest First</option>
            <option value="startTime-desc" className="bg-[#181818] text-[#F5F5F5]">Latest First</option>
            <option value="title-asc" className="bg-[#181818] text-[#F5F5F5]">Title (A-Z)</option>
            <option value="priority-desc" className="bg-[#181818] text-[#F5F5F5]">Priority (High-Low)</option>
            <option value="createdAt-desc" className="bg-[#181818] text-[#F5F5F5]">Recently Created</option>
          </select>
        </div>

        {/* View Switcher (List / Calendar) */}
        <div className="flex items-center rounded-lg bg-[#181818] border border-[#303030] p-0.5 ml-1">
          <button
            onClick={() => onViewModeChange("list")}
            title="List View"
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors",
              viewMode === "list"
                ? "bg-[#262626] text-[#F5F5F5] font-medium shadow-sm"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => onViewModeChange("calendar")}
            title="Calendar View"
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors",
              viewMode === "calendar"
                ? "bg-[#262626] text-[#F5F5F5] font-medium shadow-sm"
                : "text-[#737373] hover:text-[#F5F5F5]"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
