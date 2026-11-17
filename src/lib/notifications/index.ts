import { prisma } from "@/lib/prisma/client";

export type NotificationType = "INFO" | "WARNING" | "SUCCESS" | "ALERT";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export interface INotificationService {
  create(params: CreateNotificationParams): Promise<{ id: string }>;
  getUnreadCount(userId: string): Promise<number>;
  listForUser(userId: string, limit?: number): Promise<Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link: string | null;
    createdAt: Date;
  }>>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}

export class DatabaseNotificationService implements INotificationService {
  async create({
    userId,
    title,
    message,
    type = "INFO",
    link,
  }: CreateNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
      select: { id: true },
    });
    return notification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async listForUser(userId: string, limit = 20) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        link: true,
        createdAt: true,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationService: INotificationService =
  new DatabaseNotificationService();
