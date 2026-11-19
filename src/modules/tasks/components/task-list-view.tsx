"use client";

import React from "react";
import { TaskDto, TaskStatus } from "../types";
import { formatKolkataDate, isOverdueKolkata, isDueTodayKolkata } from "@/lib/utils/timezone";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CheckSquare,
  Clock,
  AlertCircle,
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
            className="h-16 w-full animate-pulse rounded-lg border border-[#292929] bg-[#181818]"
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
            className="inline-flex items-center justify-center rounded-lg bg-[#383838] border border-[#484848]/40 px-3.5 py-1.5 text-xs font-medium text-[#F5F5F5] hover:bg-[#454545] transition-colors"
          >
            Create New Task
          </button>
        }
      />
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="rounded bg-[#2A1818] border border-[#4A2020] px-1.5 py-0.2 text-[9px] font-medium text-[#EF4444]">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="rounded bg-[#282828] border border-[#383838] px-1.5 py-0.2 text-[9px] font-medium text-[#F5F5F5]">
            HIGH
          </span>
        );
      case "NORMAL":
        return (
          <span className="rounded bg-[#222222] border border-[#303030] px-1.5 py-0.2 text-[9px] font-medium text-[#A3A3A3]">
            NORMAL
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="rounded bg-[#1C1C1C] border border-[#292929] px-1.5 py-0.2 text-[9px] font-medium text-[#737373]">
            LOW
          </span>
        );
    }
  };

  const statusIcons: Record<TaskStatus, React.ReactNode> = {
    BACKLOG: <Circle className="h-3.5 w-3.5 text-[#555555]" />,
    TODO: <Circle className="h-3.5 w-3.5 text-[#737373]" />,
    IN_PROGRESS: <Clock className="h-3.5 w-3.5 text-[#A3A3A3]" />,
    IN_REVIEW: <Clock className="h-3.5 w-3.5 text-[#A3A3A3]" />,
    COMPLETED: <CheckCircle2 className="h-3.5 w-3.5 text-[#D4D4D4]" />,
    CANCELLED: <Circle className="h-3.5 w-3.5 text-[#555555] line-through" />,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#292929] bg-[#181818]">
      <div className="divide-y divide-[#292929]">
        {tasks.map((task) => {
          const isOverdue = isOverdueKolkata(task.dueDate, task.status);
          const isDueToday = isDueTodayKolkata(task.dueDate);
          const isDone = task.status === "COMPLETED";

          return (
            <div
              key={task.id}
              className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-[#202020] ${
                isDone ? "opacity-60 bg-[#141414]" : ""
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
                  className="mt-0.5 shrink-0 rounded p-0.5 text-[#737373] hover:text-[#F5F5F5] transition-colors focus:outline-none"
                  title={isDone ? "Reopen task" : "Mark as completed"}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#A3A3A3]" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-[#737373] hover:text-[#F5F5F5]" />
                  )}
                </button>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      onClick={() => onViewDetail(task)}
                      className={`text-xs sm:text-sm font-medium cursor-pointer hover:text-[#FFFFFF] transition-colors truncate max-w-md ${
                        isDone ? "line-through text-[#737373]" : "text-[#F5F5F5]"
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Priority Badge */}
                    {getPriorityBadge(task.priority)}

                    {/* Status indicator */}
                    <span className="rounded bg-[#202020] border border-[#292929] px-1.5 py-0.5 text-[10px] text-[#A3A3A3] font-medium flex items-center gap-1">
                      {statusIcons[task.status]}
                      {task.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Description preview */}
                  {task.description && (
                    <p className="text-xs text-[#737373] line-clamp-1 max-w-xl">
                      {task.description}
                    </p>
                  )}

                  {/* Metadata Chips: Category, Project, Dates */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#737373] pt-0.5">
                    {task.category && (
                      <span className="inline-flex items-center gap-1 font-medium text-[#737373]">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: task.category.color || "#737373",
                          }}
                        />
                        {task.category.name}
                      </span>
                    )}

                    {task.project && (
                      <span className="rounded bg-[#202020] border border-[#292929] px-1.5 py-0.2 text-[10px] text-[#737373]">
                        {task.project.name}
                      </span>
                    )}

                    {task.dueDate && (
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          isOverdue
                            ? "text-[#EF4444]"
                            : isDueToday
                            ? "text-[#D4D4D4]"
                            : "text-[#737373]"
                        }`}
                      >
                        {isOverdue ? (
                          <AlertCircle className="h-3 w-3 text-[#EF4444]" />
                        ) : (
                          <Calendar className="h-3 w-3 text-[#737373]" />
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
                  className="h-7 rounded border border-[#303030] bg-[#202020] px-2 text-[11px] text-[#A3A3A3] hover:text-[#F5F5F5] focus:outline-none focus:border-[#454545] transition-colors"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  type="button"
                  onClick={() => onViewDetail(task)}
                  className="rounded p-1.5 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#252525] transition-colors"
                  title="View details"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="rounded p-1.5 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#252525] transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  className="rounded p-1.5 text-[#737373] hover:text-[#EF4444] hover:bg-[#2A1818] transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
