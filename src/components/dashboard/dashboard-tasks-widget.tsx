"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { TaskDto } from "@/modules/tasks/types";

interface DashboardTasksWidgetProps {
  initialTasks: TaskDto[];
}

type FilterTab = "pending" | "today" | "high" | "overdue";

export function DashboardTasksWidget({ initialTasks }: DashboardTasksWidgetProps) {
  const [tasks, setTasks] = useState<TaskDto[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Helper to test if task is overdue
  const isTaskOverdue = (task: TaskDto) => {
    if (task.status === "COMPLETED") return false;
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    return due < now && due.toISOString().split("T")[0] !== todayStr;
  };

  // Helper to test if task is due today
  const isTaskDueToday = (task: TaskDto) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    return due.toISOString().split("T")[0] === todayStr;
  };

  // Filter tasks based on activeTab
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "pending") {
      return t.status !== "COMPLETED";
    }
    if (activeTab === "today") {
      return isTaskDueToday(t) && t.status !== "COMPLETED";
    }
    if (activeTab === "high") {
      return (
        (t.priority === "CRITICAL" || t.priority === "HIGH") &&
        t.status !== "COMPLETED"
      );
    }
    if (activeTab === "overdue") {
      return isTaskOverdue(t);
    }
    return true;
  });

  // Inline Quick Complete action
  const handleToggleComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (updatingTaskId) return;

    setUpdatingTaskId(taskId);

    // Optimistically update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "COMPLETED",
              completedAt: new Date(),
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!res.ok) {
        throw new Error("Failed to mark task as completed");
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setTasks(previousTasks);
    } finally {
      setUpdatingTaskId(null);
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

  const formatDueDisplay = (task: TaskDto) => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const isOverdue = isTaskOverdue(task);
    const isToday = isTaskDueToday(task);

    if (isOverdue) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-[#EF4444]">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </span>
      );
    }
    if (isToday) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-[#D4D4D4]">
          <Clock className="h-3 w-3" />
          Today
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] text-[#737373]">
        <Calendar className="h-3 w-3 text-[#737373]" />
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(due)}
      </span>
    );
  };

  // Counts for tabs
  const pendingCount = tasks.filter((t) => t.status !== "COMPLETED").length;
  const todayCount = tasks.filter((t) => isTaskDueToday(t) && t.status !== "COMPLETED").length;
  const highCount = tasks.filter(
    (t) => (t.priority === "CRITICAL" || t.priority === "HIGH") && t.status !== "COMPLETED"
  ).length;
  const overdueCount = tasks.filter((t) => isTaskOverdue(t)).length;

  return (
    <div className="rounded-xl border border-[#292929] bg-[#202020] p-5 shadow-sm">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#292929]">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-[#A3A3A3]" />
          <h2 className="text-base font-semibold text-[#F5F5F5]">My Tasks</h2>
          <span className="rounded-full bg-[#181818] border border-[#292929] px-2 py-0.5 text-xs text-[#737373] font-medium">
            {pendingCount} active
          </span>
        </div>

        <Link
          href="/tasks"
          className="flex items-center gap-1 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors self-start sm:self-auto"
        >
          <span>View All Tasks</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
            activeTab === "pending"
              ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]"
              : "bg-[#181818] text-[#737373] hover:text-[#F5F5F5] border border-[#292929]"
          }`}
        >
          <span>All Pending</span>
          <span className="text-[10px] opacity-75">({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("today")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
            activeTab === "today"
              ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]"
              : "bg-[#181818] text-[#737373] hover:text-[#F5F5F5] border border-[#292929]"
          }`}
        >
          <span>Due Today</span>
          {todayCount > 0 && (
            <span className="rounded-full bg-[#454545] text-[#F5F5F5] px-1.5 py-0.2 text-[9px]">
              {todayCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("high")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
            activeTab === "high"
              ? "bg-[#343434] text-[#F5F5F5] border border-[#404040]"
              : "bg-[#181818] text-[#737373] hover:text-[#F5F5F5] border border-[#292929]"
          }`}
        >
          <span>High Priority</span>
          <span className="text-[10px] opacity-75">({highCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors ${
            activeTab === "overdue"
              ? "bg-[#2A1818] text-[#EF4444] border border-[#4A2020]"
              : "bg-[#181818] text-[#737373] hover:text-[#F5F5F5] border border-[#292929]"
          }`}
        >
          <span>Overdue</span>
          {overdueCount > 0 && (
            <span className="rounded-full bg-[#EF4444] text-white px-1.5 py-0.2 text-[9px] font-bold">
              {overdueCount}
            </span>
          )}
        </button>
      </div>

      {/* Task Items List */}
      <div className="mt-3 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="rounded-lg bg-[#181818]/40 py-8 px-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-[#555555] mb-2" />
            <p className="text-xs font-medium text-[#F5F5F5]">
              {activeTab === "overdue"
                ? "No overdue tasks"
                : activeTab === "today"
                ? "No tasks due today"
                : activeTab === "high"
                ? "No urgent or high priority tasks"
                : "No pending tasks"}
            </p>
            <p className="text-[11px] text-[#737373] mt-1 max-w-xs mx-auto">
              {activeTab === "overdue"
                ? "All deadlines are on track."
                : "Enjoy your focus time or create a new task."}
            </p>
          </div>
        ) : (
          filteredTasks.slice(0, 6).map((task) => (
            <div
              key={task.id}
              className="group flex items-center justify-between gap-3 rounded-lg border border-[#292929] bg-[#181818] p-3 transition-all hover:bg-[#242424] hover:border-[#383838]"
            >
              {/* Left: Complete Checkbox + Title + Project */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => handleToggleComplete(task.id, e)}
                  disabled={updatingTaskId === task.id}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#3A3A3A] bg-[#202020] hover:border-[#737373] hover:bg-[#282828] transition-colors"
                  title="Mark as completed"
                >
                  <Check className="h-3 w-3 text-transparent hover:text-[#F5F5F5] transition-colors" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tasks?selected=${task.id}`}
                      className="truncate text-xs font-medium text-[#F5F5F5] hover:text-[#FFFFFF] transition-colors"
                    >
                      {task.title}
                    </Link>
                  </div>

                  {task.project && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#737373] truncate">
                        {task.project.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Badges & Due Date */}
              <div className="flex items-center gap-2.5 shrink-0">
                {getPriorityBadge(task.priority)}
                {formatDueDisplay(task)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
