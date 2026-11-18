"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
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

  const priorityVariants: Record<string, "destructive" | "warning" | "default" | "secondary" | "outline"> = {
    CRITICAL: "destructive",
    HIGH: "warning",
    NORMAL: "default",
    LOW: "secondary",
  };

  const statusLabels: Record<TaskStatus, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const isDone = task.status === "COMPLETED";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <div className="space-y-5">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={priorityVariants[task.priority] || "default"}>
            {task.priority} Priority
          </Badge>

          <span className="rounded bg-sidebar-accent px-2 py-0.5 text-xs font-semibold text-secondary-text">
            {statusLabels[task.status]}
          </span>

          {isOverdue && (
            <span className="inline-flex items-center gap-1 rounded bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-xs font-semibold text-red-400">
              <AlertTriangle className="h-3 w-3" /> Overdue
            </span>
          )}

          {isDueToday && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-400">
              <Clock className="h-3 w-3" /> Due Today
            </span>
          )}
        </div>

        {/* Task Title */}
        <h2 className="text-xl font-bold tracking-tight text-foreground break-words">
          {task.title}
        </h2>

        {/* Description */}
        <div className="rounded-md border border-border/60 bg-[#0A101C] p-4 text-xs leading-relaxed text-secondary-text whitespace-pre-wrap">
          {task.description ? (
            task.description
          ) : (
            <span className="italic text-muted-foreground">No description provided.</span>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Category */}
          <div className="flex items-center gap-2.5">
            <Tag className="h-4 w-4 text-secondary-text shrink-0" />
            <span className="text-secondary-text">Category:</span>
            {task.category ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                {task.category.color && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: task.category.color }}
                  />
                )}
                {task.category.name}
              </span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </div>

          {/* Project */}
          <div className="flex items-center gap-2.5">
            <Folder className="h-4 w-4 text-secondary-text shrink-0" />
            <span className="text-secondary-text">Project:</span>
            {task.project ? (
              <span className="font-medium text-foreground">
                {task.project.name}
              </span>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-secondary-text shrink-0" />
            <span className="text-secondary-text">Start Date:</span>
            <span className="font-medium text-foreground">
              {task.startDate ? formatKolkataDate(task.startDate) : "Not set"}
            </span>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-secondary-text shrink-0" />
            <span className="text-secondary-text">Due Date:</span>
            <span
              className={`font-medium ${
                isOverdue
                  ? "text-red-400 font-semibold"
                  : isDueToday
                  ? "text-amber-400 font-semibold"
                  : "text-foreground"
              }`}
            >
              {task.dueDate ? formatKolkataDate(task.dueDate) : "Not set"}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-border/50 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>Created: {formatKolkataDate(task.createdAt, true)}</span>
          {task.completedAt && (
            <span className="text-emerald-400">
              Completed: {formatKolkataDate(task.completedAt, true)}
            </span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Toggle Status */}
          <div>
            {isDone ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-amber-400 hover:text-amber-300"
                onClick={() => onStatusChange(task, "TODO")}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reopen Task
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
                onClick={() => onStatusChange(task, "COMPLETED")}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              <Edit2 className="h-3.5 w-3.5 text-primary" /> Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs"
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
