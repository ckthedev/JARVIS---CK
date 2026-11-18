"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  TaskDto,
  TaskPriority,
  TaskStatus,
  TaskCategoryDto,
  ProjectDto,
} from "../types";
import { createTaskSchema } from "@/lib/validations/task";
import { AlertCircle } from "lucide-react";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (task: TaskDto) => void;
  taskToEdit?: TaskDto | null;
  categories: TaskCategoryDto[];
  projects: ProjectDto[];
  initialStatus?: TaskStatus;
}

export function TaskDialog({
  open,
  onClose,
  onSuccess,
  taskToEdit,
  categories,
  projects,
  initialStatus = "TODO",
}: TaskDialogProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [categoryId, setCategoryId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setCategoryId(taskToEdit.categoryId || "");
      setProjectId(taskToEdit.projectId || "");
      setStartDate(
        taskToEdit.startDate
          ? new Date(taskToEdit.startDate).toISOString().slice(0, 10)
          : ""
      );
      setDueDate(
        taskToEdit.dueDate
          ? new Date(taskToEdit.dueDate).toISOString().slice(0, 10)
          : ""
      );
    } else {
      setTitle("");
      setDescription("");
      setPriority("NORMAL");
      setStatus(initialStatus);
      setCategoryId("");
      setProjectId("");
      setStartDate("");
      setDueDate("");
    }
    setError(null);
    setFieldErrors({});
  }, [taskToEdit, initialStatus, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      categoryId: categoryId || null,
      projectId: projectId || null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };

    const validated = createTaskSchema.safeParse(payload);
    if (!validated.success) {
      setFieldErrors(validated.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const url = taskToEdit ? `/api/tasks/${taskToEdit.id}` : "/api/tasks";
      const method = taskToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setError(data.error || "Failed to save task.");
        }
        setLoading(false);
        return;
      }

      toast({
        title: taskToEdit ? "Task Updated" : "Task Created",
        description: `"${data.task.title}" has been saved successfully.`,
        variant: "success",
      });

      onSuccess(data.task);
      onClose();
    } catch {
      setError("Network error occurred while saving task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={taskToEdit ? "Edit Task" : "Create New Task"}
      description={
        taskToEdit
          ? "Update the parameters, deadlines, or categorization for this task."
          : "Add a prioritized task to your JARVIS personal productivity schedule."
      }
      maxWidth="lg"
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="task-title">
            Task Title <span className="text-primary">*</span>
          </Label>
          <Input
            id="task-title"
            required
            placeholder="e.g. Upgrade cloud cluster deployment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {fieldErrors.title && (
            <p className="text-xs text-red-400">{fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="task-description">Description</Label>
          <textarea
            id="task-description"
            rows={3}
            className="flex w-full rounded-md border border-input bg-[#0A101C] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Detailed notes, checklist items, or execution instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-400">{fieldErrors.description[0]}</p>
          )}
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="flex h-9 w-full rounded-md border border-input bg-[#0A101C] px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-status">Status</Label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="flex h-9 w-full rounded-md border border-input bg-[#0A101C] px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Category & Project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-category">Category</Label>
            <select
              id="task-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-[#0A101C] px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-project">Project</Label>
            <select
              id="task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-[#0A101C] px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === "ARCHIVED" ? "(Archived)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-start-date">Start Date</Label>
            <Input
              id="task-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due-date">Due Date</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={loading}>
            {taskToEdit ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
