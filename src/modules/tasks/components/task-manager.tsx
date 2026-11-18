"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  TaskDto,
  TaskFilters,
  TaskViewTab,
  TaskStatus,
  TaskPriority,
  TaskCategoryDto,
  ProjectDto,
} from "../types";
import { TaskListView } from "./task-list-view";
import { TaskKanbanView } from "./task-kanban-view";
import { TaskFiltersBar } from "./task-filters";
import { TaskDialog } from "./task-dialog";
import { TaskDetailModal } from "./task-detail-modal";
import { CategoryManagerModal } from "./category-manager-modal";
import { ProjectManagerModal } from "./project-manager-modal";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Tag,
  Folder,
  Sun,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Layers,
  XCircle,
} from "lucide-react";

interface TaskManagerProps {
  initialCategories: TaskCategoryDto[];
  initialProjects: ProjectDto[];
}

const TABS: { id: TaskViewTab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Tasks", icon: <Layers className="h-3.5 w-3.5" /> },
  { id: "my-day", label: "My Day", icon: <Sun className="h-3.5 w-3.5 text-amber-400" /> },
  { id: "upcoming", label: "Upcoming", icon: <Calendar className="h-3.5 w-3.5 text-primary" /> },
  { id: "overdue", label: "Overdue", icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> },
  { id: "completed", label: "Completed", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> },
  { id: "cancelled", label: "Cancelled", icon: <XCircle className="h-3.5 w-3.5 text-muted-foreground" /> },
];

export function TaskManager({
  initialCategories,
  initialProjects,
}: TaskManagerProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Active view tab (from query param or default to 'all')
  const initialView = (searchParams.get("view") as TaskViewTab) || "all";
  const initialPriority = (searchParams.get("priority") as TaskPriority) || undefined;
  const initialStatus = (searchParams.get("status") as TaskStatus) || undefined;
  const initialCategory = searchParams.get("category") || undefined;
  const initialProject = searchParams.get("project") || undefined;
  const initialSearch = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState<TaskViewTab>(initialView);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Filters
  const [filters, setFilters] = useState<TaskFilters>({
    view: initialView,
    priority: initialPriority,
    status: initialStatus,
    categoryId: initialCategory,
    projectId: initialProject,
    search: initialSearch,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Data states
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [categories, setCategories] = useState<TaskCategoryDto[]>(initialCategories);
  const [projects, setProjects] = useState<ProjectDto[]>(initialProjects);
  const [loading, setLoading] = useState(true);

  // Tab counts
  const [tabCounts, setTabCounts] = useState<Record<TaskViewTab, number>>({
    all: 0,
    "my-day": 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
    cancelled: 0,
  });

  // Modal states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskDto | null>(null);
  const [createColumnStatus, setCreateColumnStatus] = useState<TaskStatus>("TODO");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.view) params.set("view", filters.view);
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.projectId) params.set("projectId", filters.projectId);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Fetch tab counts & stats
  const fetchCounts = useCallback(async () => {
    try {
      const [resAll, resMyDay, resUpcoming, resOverdue, resCompleted, resCancelled] =
        await Promise.all([
          fetch("/api/tasks?view=all"),
          fetch("/api/tasks?view=my-day"),
          fetch("/api/tasks?view=upcoming"),
          fetch("/api/tasks?view=overdue"),
          fetch("/api/tasks?view=completed"),
          fetch("/api/tasks?view=cancelled"),
        ]);

      const [dataAll, dataMyDay, dataUpcoming, dataOverdue, dataCompleted, dataCancelled] =
        await Promise.all([
          resAll.ok ? resAll.json() : { tasks: [] },
          resMyDay.ok ? resMyDay.json() : { tasks: [] },
          resUpcoming.ok ? resUpcoming.json() : { tasks: [] },
          resOverdue.ok ? resOverdue.json() : { tasks: [] },
          resCompleted.ok ? resCompleted.json() : { tasks: [] },
          resCancelled.ok ? resCancelled.json() : { tasks: [] },
        ]);

      setTabCounts({
        all: dataAll.tasks?.length || 0,
        "my-day": dataMyDay.tasks?.length || 0,
        upcoming: dataUpcoming.tasks?.length || 0,
        overdue: dataOverdue.tasks?.length || 0,
        completed: dataCompleted.tasks?.length || 0,
        cancelled: dataCancelled.tasks?.length || 0,
      });
    } catch {
      // Ignore count fetch errors
    }
  }, []);

  // Fetch categories and projects
  const refreshMetadata = useCallback(async () => {
    try {
      const [catRes, projRes] = await Promise.all([
        fetch("/api/tasks/categories"),
        fetch("/api/tasks/projects"),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
      }
    } catch {
      // Ignore metadata refresh errors
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchCounts();
  }, [fetchTasks, fetchCounts]);

  // Handle Tab Switch
  const handleTabChange = (tab: TaskViewTab) => {
    setActiveTab(tab);
    setFilters((prev) => ({
      ...prev,
      view: tab,
      status: undefined, // Reset explicit status filter on tab change
    }));
  };

  // Status Change handler
  const handleStatusChange = async (task: TaskDto, newStatus: TaskStatus) => {
    // Optimistic UI update
    const prevTasks = [...tasks];
    setTasks((current) =>
      current.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setTasks(prevTasks);
        toast({
          title: "Update Failed",
          description: "Could not update task status.",
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      toast({
        title: "Status Updated",
        description: `Task marked as ${newStatus.replace("_", " ").toLowerCase()}.`,
        variant: "success",
      });

      // Update selected task in detail modal if open
      if (selectedTask?.id === task.id) {
        setSelectedTask(data.task);
      }

      fetchTasks();
      fetchCounts();
    } catch {
      setTasks(prevTasks);
      toast({
        title: "Error",
        description: "Network error occurred.",
        variant: "destructive",
      });
    }
  };

  // Kanban Drag-and-Drop handler
  const handleTaskMoved = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    const prevTasks = [...tasks];
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setTasks(prevTasks);
        return false;
      }

      fetchCounts();
      return true;
    } catch {
      setTasks(prevTasks);
      return false;
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast({
          title: "Delete Failed",
          description: data.error || "Could not delete task.",
          variant: "destructive",
        });
        setDeleting(false);
        return;
      }

      toast({
        title: "Task Deleted",
        description: `"${taskToDelete.title}" has been removed.`,
        variant: "success",
      });

      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      if (detailModalOpen && selectedTask?.id === taskToDelete.id) {
        setDetailModalOpen(false);
      }
      fetchTasks();
      fetchCounts();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Master Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" />
            Task Manager
          </h1>
          <p className="mt-1 text-xs text-secondary-text">
            Prioritize, track, and organize your daily execution items and projects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => setCategoryModalOpen(true)}
          >
            <Tag className="h-3.5 w-3.5 text-primary" />
            Categories ({categories.length})
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => setProjectModalOpen(true)}
          >
            <Folder className="h-3.5 w-3.5 text-secondary" />
            Projects ({projects.length})
          </Button>

          <Button
            size="sm"
            className="gap-1.5 text-xs font-semibold"
            onClick={() => {
              setTaskToEdit(null);
              setCreateColumnStatus("TODO");
              setTaskDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (All Tasks, My Day, Upcoming, Overdue, Completed, Cancelled) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/30">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                  : "text-secondary-text hover:text-foreground hover:bg-sidebar-accent"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive
                    ? "bg-primary text-background"
                    : "bg-sidebar-accent text-secondary-text"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <TaskFiltersBar
        filters={filters}
        onChange={(newFilters) => setFilters(newFilters)}
        categories={categories}
        projects={projects}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
      />

      {/* View Content (List View vs Kanban Board) */}
      {viewMode === "list" ? (
        <TaskListView
          tasks={tasks}
          loading={loading}
          onViewDetail={(task) => {
            setSelectedTask(task);
            setDetailModalOpen(true);
          }}
          onEdit={(task) => {
            setTaskToEdit(task);
            setTaskDialogOpen(true);
          }}
          onDelete={(task) => {
            setTaskToDelete(task);
            setDeleteConfirmOpen(true);
          }}
          onStatusChange={handleStatusChange}
          onCreateNew={() => {
            setTaskToEdit(null);
            setCreateColumnStatus("TODO");
            setTaskDialogOpen(true);
          }}
        />
      ) : (
        <TaskKanbanView
          tasks={tasks}
          onTaskMoved={handleTaskMoved}
          onViewDetail={(task) => {
            setSelectedTask(task);
            setDetailModalOpen(true);
          }}
          onEdit={(task) => {
            setTaskToEdit(task);
            setTaskDialogOpen(true);
          }}
          onDelete={(task) => {
            setTaskToDelete(task);
            setDeleteConfirmOpen(true);
          }}
          onCreateInColumn={(status) => {
            setTaskToEdit(null);
            setCreateColumnStatus(status);
            setTaskDialogOpen(true);
          }}
        />
      )}

      {/* Task Creation & Edit Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSuccess={() => {
          fetchTasks();
          fetchCounts();
        }}
        taskToEdit={taskToEdit}
        categories={categories}
        projects={projects}
        initialStatus={createColumnStatus}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        task={selectedTask}
        onEdit={(task) => {
          setDetailModalOpen(false);
          setTaskToEdit(task);
          setTaskDialogOpen(true);
        }}
        onDelete={(task) => {
          setDetailModalOpen(false);
          setTaskToDelete(task);
          setDeleteConfirmOpen(true);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onRefresh={() => {
          refreshMetadata();
          fetchTasks();
        }}
      />

      {/* Project Manager Modal */}
      <ProjectManagerModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        projects={projects}
        onRefresh={() => {
          refreshMetadata();
          fetchTasks();
        }}
      />

      {/* Soft Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? The task will be archived via soft-deletion and removed from active views.`}
        confirmText="Confirm Delete"
        isLoading={deleting}
      />
    </div>
  );
}
