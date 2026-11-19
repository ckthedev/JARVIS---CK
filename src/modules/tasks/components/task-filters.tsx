"use client";

import React from "react";
import {
  TaskFilters,
  TaskPriority,
  TaskStatus,
  TaskCategoryDto,
  ProjectDto,
} from "../types";
import {
  Search,
  X,
  List,
  Kanban,
  ArrowUpDown,
} from "lucide-react";

interface TaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  categories: TaskCategoryDto[];
  projects: ProjectDto[];
  viewMode: "list" | "kanban";
  onViewModeChange: (mode: "list" | "kanban") => void;
}

export function TaskFiltersBar({
  filters,
  onChange,
  categories,
  projects,
  viewMode,
  onViewModeChange,
}: TaskFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.priority ||
      filters.status ||
      filters.categoryId ||
      filters.projectId ||
      filters.sortBy !== "createdAt" ||
      filters.sortOrder !== "desc"
  );

  const clearFilters = () => {
    onChange({
      ...filters,
      search: "",
      priority: undefined,
      status: undefined,
      categoryId: undefined,
      projectId: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  return (
    <div className="space-y-3">
      {/* Search & Mode Switcher Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#737373]" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-8 w-full rounded-lg border border-[#303030] bg-[#181818] pl-8 pr-8 text-xs text-[#F5F5F5] placeholder:text-[#737373] focus:border-[#454545] focus:outline-none transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#F5F5F5]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle (List vs Kanban) */}
        <div className="flex items-center rounded-lg border border-[#303030] bg-[#181818] p-0.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]"
                : "text-[#737373] hover:text-[#F5F5F5] border border-transparent"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === "kanban"
                ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]"
                : "text-[#737373] hover:text-[#F5F5F5] border border-transparent"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
        </div>
      </div>

      {/* Filter Dropdowns Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* Priority Filter */}
        <select
          value={filters.priority || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              priority: (e.target.value as TaskPriority) || undefined,
            })
          }
          className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] focus:border-[#454545] focus:outline-none transition-colors"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              status: (e.target.value as TaskStatus) || undefined,
            })
          }
          className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] focus:border-[#454545] focus:outline-none transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Category Filter */}
        {categories.length > 0 && (
          <select
            value={filters.categoryId || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                categoryId: e.target.value || undefined,
              })
            }
            className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] focus:border-[#454545] focus:outline-none transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Project Filter */}
        {projects.length > 0 && (
          <select
            value={filters.projectId || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                projectId: e.target.value || undefined,
              })
            }
            className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] focus:border-[#454545] focus:outline-none transition-colors"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Sort Field */}
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-[#737373]" />
          <select
            value={filters.sortBy || "createdAt"}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as "createdAt" | "dueDate" | "priority" | "title",
              })
            }
            className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] focus:border-[#454545] focus:outline-none transition-colors"
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...filters,
                sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
              })
            }
            className="h-8 rounded-lg border border-[#303030] bg-[#181818] px-2 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
            title={`Sort ${filters.sortOrder === "asc" ? "Descending" : "Ascending"}`}
          >
            {filters.sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 h-8 rounded-lg border border-[#303030] bg-[#252525] px-2.5 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
