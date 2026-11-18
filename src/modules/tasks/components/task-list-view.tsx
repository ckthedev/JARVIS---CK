"use client";

import React from "react";
import { TaskDto, TaskStatus } from "../types";
import { Badge } from "@/components/ui/badge";
import { formatKolkataDate, isOverdueKolkata, isDueTodayKolkata } from "@/lib/utils/timezone";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Calendar,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";

interface TaskListViewProps {
  tasks: TaskDto[];
  loading: boolean;
  onViewDetail: (task: TaskDto) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
  onStatusChange: (task: TaskDto, newStatus: TaskStatus) => void;
  onCreateNew: () => void;
}

export function TaskListView({
  tasks,
  loading,
  onViewDetail,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateNew,
}: TaskListViewProps) {
  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-lg border border-border/50 bg-[#111B2B]/40"
          />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks found"
        description="There are no tasks matching your selected view and filters."
        action={
          <button
            onClick={onCreateNew}
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-background hover:bg-primary-hover transition-colors"
          >
            Create New Task
          </button>
        }
      />
    );
  }

  const priorityVariants: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
    CRITICAL: "destructive",
    HIGH: "warning",
    NORMAL: "default",
    LOW: "secondary",
  };

  const statusIcons: Record<TaskStatus, React.ReactNode> = {
    TODO: <Circle className="h-4 w-4 text-secondary-text" />,
    IN_PROGRESS: <Clock className="h-4 w-4 text-primary animate-spin" />,
    COMPLETED: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    CANCELLED: <Circle className="h-4 w-4 text-muted-foreground line-through" />,
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#111B2B] shadow-jarvis">
      <div className="divide-y divide-border/50">
        {tasks.map((task) => {
          const isOverdue = isOverdueKolkata(task.dueDate, task.status);
          const isDueToday = isDueTodayKolkata(task.dueDate);
          const isDone = task.status === "COMPLETED";

          return (
            <div
              key={task.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-card-hover ${
                isDone ? "opacity-60 bg-sidebar/20" : ""
              }`}
            >
              {/* Left Column: Quick Toggle & Title/Metadata */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    onStatusChange(task, isDone ? "TODO" : "COMPLETED")
                  }
                  className="mt-0.5 shrink-0 rounded p-0.5 text-secondary-text hover:text-primary transition-colors focus:outline-none"
                  title={isDone ? "Reopen task" : "Mark as completed"}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle className="h-5 w-5 text-secondary-text hover:text-primary" />
                  )}
                </button>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      onClick={() => onViewDetail(task)}
                      className={`text-sm font-semibold cursor-pointer hover:text-primary transition-colors truncate max-w-md ${
                        isDone ? "line-through text-secondary-text" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority Badge */}
                    <Badge
                      variant={priorityVariants[task.priority] || "default"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {task.priority}
                    </Badge>

                    {/* Status indicator */}
                    <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-secondary-text font-medium flex items-center gap-1">
                      {statusIcons[task.status]}
                      {task.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Description preview */}
                  {task.description && (
                    <p className="text-xs text-secondary-text line-clamp-1 max-w-xl">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata Chips: Category, Project, Dates */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-secondary-text pt-1">
                    {task.category && (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: task.category.color || "#00D4FF",
                          }}
                        />
                        {task.category.name}
                      </span>
                    )}

                    {task.project && (
                      <span className="rounded bg-sidebar-accent/80 border border-border px-1.5 py-0.2 text-[10px]">
                        📁 {task.project.name}
                      </span>
                    )}

                    {task.dueDate && (
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          isOverdue
                            ? "text-red-400 font-semibold"
                            : isDueToday
                            ? "text-amber-400 font-semibold"
                            : ""
                        }`}
                      >
                        {isOverdue ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Calendar className="h-3 w-3" />
                        )}
                        Due {formatKolkataDate(task.dueDate)}
                        {isOverdue && " (Overdue)"}
                        {isDueToday && " (Today)"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                {/* Quick Status Dropdown */}
                <select
                  value={task.status}
                  onChange={(e) =>
                    onStatusChange(task, e.target.value as TaskStatus)
                  }
                  className="h-7 rounded border border-border bg-[#0A101C] px-2 text-[11px] text-secondary-text hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  type="button"
                  onClick={() => onViewDetail(task)}
                  className="rounded p-1.5 text-secondary-text hover:text-foreground hover:bg-sidebar-accent transition-colors"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="rounded p-1.5 text-secondary-text hover:text-primary hover:bg-sidebar-accent transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  className="rounded p-1.5 text-secondary-text hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
