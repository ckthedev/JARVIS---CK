"use client";

import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { TaskDto, TaskStatus } from "../types";
import { formatKolkataDate, isOverdueKolkata, isDueTodayKolkata } from "@/lib/utils/timezone";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  AlertCircle,
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

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "COMPLETED", label: "Completed" },
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-xl border border-[#292929] bg-[#181818] p-3 min-h-[520px] transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#292929]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    {col.label}
                  </h3>
                  <span className="rounded bg-[#202020] px-1.5 py-0.2 text-[10px] font-medium text-[#737373] border border-[#292929]">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateInColumn(col.id)}
                  className="rounded p-1 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#252525] transition-colors"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Droppable Task List */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 py-2.5 space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-[#202020]/60 rounded-lg" : ""
                    }`}
                  >
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="py-14 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-[#555555]">No tasks</span>
                        <button
                          type="button"
                          onClick={() => onCreateInColumn(col.id)}
                          className="mt-2 text-[11px] text-[#737373] hover:text-[#A3A3A3] transition-colors"
                        >
                          + Add task
                        </button>
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
                              className={`rounded-lg border border-[#292929] bg-[#202020] p-3 text-xs transition-all hover:bg-[#242424] hover:border-[#383838] ${
                                snapshotDrag.isDragging
                                  ? "border-[#454545] bg-[#262626] shadow-lg"
                                  : ""
                              } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                            >
                              {/* Card Header: Priority & Actions */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                {getPriorityBadge(task.priority)}

                                <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => onViewDetail(task)}
                                    className="p-1 rounded text-[#737373] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] transition-colors"
                                    title="View"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => onEdit(task)}
                                    className="p-1 rounded text-[#737373] hover:text-[#F5F5F5] hover:bg-[#2C2C2C] transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => onDelete(task)}
                                    className="p-1 rounded text-[#737373] hover:text-[#EF4444] hover:bg-[#2C2C2C] transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Task Title */}
                              <h4
                                onClick={() => onViewDetail(task)}
                                className={`font-medium cursor-pointer text-[#F5F5F5] hover:text-[#FFFFFF] transition-colors leading-snug line-clamp-2 ${
                                  task.status === "COMPLETED"
                                    ? "line-through text-[#737373]"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </h4>

                              {/* Description Preview */}
                              {task.description && (
                                <p className="mt-1 text-[11px] text-[#737373] line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Metadata Footer: Category & Due Date */}
                              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 border-t border-[#292929] pt-2 text-[10px]">
                                {task.category ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-[#737373]">
                                    <span
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          task.category.color || "#737373",
                                      }}
                                    />
                                    {task.category.name}
                                  </span>
                                ) : task.project ? (
                                  <span className="text-[#737373] truncate max-w-[90px]">
                                    {task.project.name}
                                  </span>
                                ) : (
                                  <span />
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
                                      <AlertCircle className="h-2.5 w-2.5 text-[#EF4444]" />
                                    ) : (
                                      <Calendar className="h-2.5 w-2.5 text-[#737373]" />
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
