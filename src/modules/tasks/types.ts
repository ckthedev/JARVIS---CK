export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
  projectId: string | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSummaryStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  urgent: number;
}
