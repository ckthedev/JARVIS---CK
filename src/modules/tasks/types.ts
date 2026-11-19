export type TaskPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "CANCELLED";
export type TaskViewTab = "all" | "my-day" | "upcoming" | "overdue" | "completed" | "cancelled";

export interface TaskCategorySummary {
  id: string;
  name: string;
  color: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  color: string | null;
  status: string;
}

export interface TaskDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  deletedAt: Date | null;
  projectId: string | null;
  categoryId: string | null;
  category?: TaskCategorySummary | null;
  project?: ProjectSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCategoryDto {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  projectId?: string;
  view?: TaskViewTab;
  sortBy?: "createdAt" | "dueDate" | "priority" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DashboardTaskStats {
  totalActive: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  critical: number;
  today: number;
  upcoming: number;
}
