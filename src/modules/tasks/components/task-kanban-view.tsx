"use client";

import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { TaskDto, TaskStatus } from "../types";
import { Badge } from "@/components/ui/badge";
import { formatKolkataDate, isOverdueKolkata, isDueTodayKolkata } from "@/lib/utils/timezone";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  AlertTriangle,
  Calendar,
  Eye,
  Trash2,
  Edit2,
} from "lucide-react";

interface TaskKanbanViewProps {
  tasks: TaskDto[];
  onTaskMoved: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  onViewDetail: (task: TaskDto) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (task: TaskDto) => void;
  onCreateInColumn: (status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; badge: string }[] = [
  { id: "TODO", label: "To Do", color: "#94A3B8", badge: "border-slate-500/30 text-slate-300" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#00D4FF", badge: "border-primary/30 text-primary" },
  { id: "COMPLETED", label: "Completed", color: "#10B981", badge: "border-emerald-500/30 text-emerald-400" },
  { id: "CANCELLED", label: "Cancelled", color: "#64748B", badge: "border-border text-secondary-text" },
];

export function TaskKanbanView({
  tasks,
  onTaskMoved,
  onViewDetail,
  onEdit,
  onDelete,
  onCreateInColumn,
}: TaskKanbanViewProps) {
  const { toast } = useToast();
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    setMovingTaskId(draggableId);

    const success = await onTaskMoved(draggableId, newStatus);
    setMovingTaskId(null);

    if (!success) {
      toast({
        title: "Update Failed",
        description: "Could not move task to new status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const priorityVariants: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
    CRITICAL: "destructive",
    HIGH: "warning",
    NORMAL: "default",
    LOW: "secondary",
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-lg border border-border bg-[#0D1421] p-3 shadow-jarvis min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {col.label}
                  </h3>
                  <span className="rounded bg-sidebar-accent px-1.5 py-0.2 text-[10px] font-semibold text-secondary-text">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateInColumn(col.id)}
                  className="rounded p-1 text-secondary-text hover:text-primary hover:bg-sidebar-accent transition-colors"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Droppable Task List */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 py-3 space-y-2.5 transition-colors ${
                      snapshot.isDraggingOver ? "bg-sidebar-accent/30 rounded-md" : ""
                    }`}
                  >
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="py-8 text-center text-[11px] text-muted-foreground border border-dashed border-border/40 rounded-md">
                        Drop tasks here
                      </div>
                    )}

                    {colTasks.map((task, index) => {
                      const isOverdue = isOverdueKolkata(task.dueDate, task.status);
                      const isDueToday = isDueTodayKolkata(task.dueDate);
                      const isUpdating = movingTaskId === task.id;

                      return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(providedDrag, snapshotDrag) => (
                            <div
                              ref={providedDrag.innerRef}
                              {...providedDrag.draggableProps}
                              {...providedDrag.dragHandleProps}
                              className={`rounded-md border border-border bg-[#111B2B] p-3 text-xs shadow-sm transition-all hover:border-border/90 ${
                                snapshotDrag.isDragging
                                  ? "shadow-jarvis-glow border-primary/50 rotate-1"
                                  : ""
                              } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                            >
                              {/* Card Header: Priority & Actions */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <Badge
                                  variant={priorityVariants[task.priority] || "default"}
                                  className="text-[9px] px-1.5 py-0"
                                >
                                  {task.priority}
                                </Badge>

                                <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => onViewDetail(task)}
                                    className="p-0.5 text-secondary-text hover:text-foreground"
                                    title="View"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => onEdit(task)}
                                    className="p-0.5 text-secondary-text hover:text-primary"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => onDelete(task)}
                                    className="p-0.5 text-secondary-text hover:text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Task Title */}
                              <h4
                                onClick={() => onViewDetail(task)}
                                className={`font-semibold cursor-pointer text-foreground hover:text-primary transition-colors leading-snug line-clamp-2 ${
                                  task.status === "COMPLETED"
                                    ? "line-through text-secondary-text"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </h4>

                              {/* Description Preview */}
                              {task.description && (
                                <p className="mt-1 text-[11px] text-secondary-text line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Metadata Footer: Category & Due Date */}
                              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 border-t border-border/40 pt-2 text-[10px]">
                                {task.category ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-secondary-text">
                                    <span
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          task.category.color || "#00D4FF",
                                      }}
                                    />
                                    {task.category.name}
                                  </span>
                                ) : task.project ? (
                                  <span className="text-secondary-text truncate max-w-[100px]">
                                    📁 {task.project.name}
                                  </span>
                                ) : (
                                  <span />
                                )}

                                {task.dueDate && (
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      isOverdue
                                        ? "text-red-400 font-bold"
                                        : isDueToday
                                        ? "text-amber-400 font-bold"
                                        : "text-secondary-text"
                                    }`}
                                  >
                                    {isOverdue ? (
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                    ) : (
                                      <Calendar className="h-2.5 w-2.5" />
                                    )}
                                    {formatKolkataDate(task.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
