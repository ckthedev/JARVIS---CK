"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-text" />
          <Input
            type="text"
            placeholder="Search tasks by title or description..."
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9 pr-8 text-xs"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-2.5 text-secondary-text hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle (List vs Kanban) */}
        <div className="flex items-center rounded-lg border border-border bg-[#0A101C] p-1 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-secondary-text hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "kanban"
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-secondary-text hover:text-foreground"
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
          className="h-8 rounded-md border border-input bg-[#0A101C] px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>

        {/* Status Filter (applicable in list view) */}
        {viewMode === "list" && (
          <select
            value={filters.status || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                status: (e.target.value as TaskStatus) || undefined,
              })
            }
            className="h-8 rounded-md border border-input bg-[#0A101C] px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}

        {/* Category Filter */}
        <select
          value={filters.categoryId || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              categoryId: e.target.value || undefined,
            })
          }
          className="h-8 rounded-md border border-input bg-[#0A101C] px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Project Filter */}
        <select
          value={filters.projectId || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              projectId: e.target.value || undefined,
            })
          }
          className="h-8 rounded-md border border-input bg-[#0A101C] px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Sort Selector */}
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-secondary-text" />
          <select
            value={filters.sortBy || "createdAt"}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as TaskFilters["sortBy"],
              })
            }
            className="h-8 rounded-md border border-input bg-[#0A101C] px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="createdAt">Created Date</option>
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
            className="h-8 rounded-md border border-input bg-[#0A101C] px-2 text-xs text-secondary-text hover:text-foreground font-mono"
            title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            {filters.sortOrder === "asc" ? "↑ ASC" : "↓ DESC"}
          </button>
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs text-primary hover:text-primary-hover gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
