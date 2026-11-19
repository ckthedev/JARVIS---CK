"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskDto, TaskStatus } from "../types";
import { formatKolkataDate, isOverdueKolkata, isDueTodayKolkata } from "@/lib/utils/timezone";
import {
  Calendar,
  Clock,
  Tag,
  Folder,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  task: TaskDto | null;
  onEdit: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
  onStatusChange: (task: TaskDto, newStatus: TaskStatus) => void;
}

export function TaskDetailModal({
  open,
  onClose,
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskDetailModalProps) {
  if (!task) return null;

  const isOverdue = isOverdueKolkata(task.dueDate, task.status);
  const isDueToday = isDueTodayKolkata(task.dueDate);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="rounded bg-[#2A1818] border border-[#4A2020] px-2 py-0.5 text-[10px] font-medium text-[#EF4444]">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="rounded bg-[#282828] border border-[#383838] px-2 py-0.5 text-[10px] font-medium text-[#F5F5F5]">
            HIGH
          </span>
        );
      case "NORMAL":
        return (
          <span className="rounded bg-[#222222] border border-[#303030] px-2 py-0.5 text-[10px] font-medium text-[#A3A3A3]">
            NORMAL
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="rounded bg-[#1C1C1C] border border-[#292929] px-2 py-0.5 text-[10px] font-medium text-[#737373]">
            LOW
          </span>
        );
    }
  };

  const statusLabels: Record<TaskStatus, string> = {
    BACKLOG: "Backlog",
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    IN_REVIEW: "In Review",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const isDone = task.status === "COMPLETED";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <div className="space-y-5">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2">
          {getPriorityBadge(task.priority)}

          <span className="rounded bg-[#202020] border border-[#292929] px-2 py-0.5 text-xs font-medium text-[#A3A3A3]">
            {statusLabels[task.status]}
          </span>

          {isOverdue && (
            <span className="inline-flex items-center gap-1 rounded bg-[#2A1818] border border-[#4A2020] px-2 py-0.5 text-xs font-medium text-[#EF4444]">
              <AlertCircle className="h-3 w-3" /> Overdue
            </span>
          )}

          {isDueToday && (
            <span className="inline-flex items-center gap-1 rounded bg-[#252525] border border-[#383838] px-2 py-0.5 text-xs font-medium text-[#D4D4D4]">
              <Clock className="h-3 w-3" /> Due Today
            </span>
          )}
        </div>

        {/* Task Title */}
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F5F5] break-words">
          {task.title}
        </h2>

        {/* Description */}
        <div className="rounded-lg border border-[#292929] bg-[#181818] p-4 text-xs leading-relaxed text-[#A3A3A3] whitespace-pre-wrap">
          {task.description ? (
            task.description
          ) : (
            <span className="italic text-[#555555]">No description provided.</span>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Category */}
          <div className="flex items-center gap-2.5">
            <Tag className="h-4 w-4 text-[#737373] shrink-0" />
            <span className="text-[#737373]">Category:</span>
            {task.category ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#F5F5F5]">
                {task.category.color && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: task.category.color }}
                  />
                )}
                {task.category.name}
              </span>
            ) : (
              <span className="text-[#555555]">None</span>
            )}
          </div>

          {/* Project */}
          <div className="flex items-center gap-2.5">
            <Folder className="h-4 w-4 text-[#737373] shrink-0" />
            <span className="text-[#737373]">Project:</span>
            {task.project ? (
              <span className="font-medium text-[#F5F5F5]">
                {task.project.name}
              </span>
            ) : (
              <span className="text-[#555555]">None</span>
            )}
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-[#737373] shrink-0" />
            <span className="text-[#737373]">Start Date:</span>
            <span className="font-medium text-[#F5F5F5]">
              {task.startDate ? formatKolkataDate(task.startDate) : "Not set"}
            </span>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-[#737373] shrink-0" />
            <span className="text-[#737373]">Due Date:</span>
            <span
              className={`font-medium ${
                isOverdue
                  ? "text-[#EF4444]"
                  : isDueToday
                  ? "text-[#D4D4D4]"
                  : "text-[#F5F5F5]"
              }`}
            >
              {task.dueDate ? formatKolkataDate(task.dueDate) : "Not set"}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-[#292929] pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#737373]">
          <span>Created: {formatKolkataDate(task.createdAt, true)}</span>
          {task.completedAt && (
            <span className="text-[#A3A3A3]">
              Completed: {formatKolkataDate(task.completedAt, true)}
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#292929] pt-4 flex flex-wrap items-center justify-between gap-2.5">
          {/* Quick Toggle Status */}
          <div>
            {isDone ? (
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => onStatusChange(task, "TODO")}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reopen Task
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => onStatusChange(task, "COMPLETED")}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => {
                onClose();
                onDelete(task);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
