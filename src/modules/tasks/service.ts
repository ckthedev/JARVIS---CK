import { prisma } from "@/lib/prisma/client";
import { TaskSummaryStats, TaskDto } from "./types";

export class TaskService {
  async getSummaryStats(userId: string): Promise<TaskSummaryStats> {
    const [total, completed, inProgress, pending, urgent] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "COMPLETED" } }),
      prisma.task.count({ where: { userId, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { userId, status: "TODO" } }),
      prisma.task.count({
        where: {
          userId,
          priority: "URGENT",
          status: { not: "COMPLETED" },
        },
      }),
    ]);

    return { total, completed, inProgress, pending, urgent };
  }

  async getRecentTasks(userId: string, limit = 5): Promise<TaskDto[]> {
    return await prisma.task.findMany({
      where: { userId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        projectId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export const taskService = new TaskService();
