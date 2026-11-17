import { prisma } from "@/lib/prisma/client";
import { ReminderDto } from "./types";

export class ReminderService {
  async getUpcomingReminders(userId: string, limit = 5): Promise<ReminderDto[]> {
    return await prisma.reminder.findMany({
      where: {
        userId,
        isCompleted: false,
      },
      orderBy: { dueAt: "asc" },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        dueAt: true,
        isCompleted: true,
        priority: true,
      },
    });
  }

  async getPendingCount(userId: string): Promise<number> {
    return await prisma.reminder.count({
      where: {
        userId,
        isCompleted: false,
      },
    });
  }
}

export const reminderService = new ReminderService();
