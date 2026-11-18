import { prisma } from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";

export type NotificationType =
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "ALERT"
  | "TASK"
  | "REMINDER"
  | "MEETING"
  | "SOCIAL"
  | "SYSTEM";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  reminderId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListNotificationsOptions {
  limit?: number;
  offset?: number;
  type?: string;
  isRead?: boolean;
}

export interface NotificationItemDto {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  reminderId?: string | null;
  metadata?: Prisma.JsonValue | null;
  createdAt: Date;
}

export interface INotificationService {
  create(params: CreateNotificationParams): Promise<{ id: string }>;
  getUnreadCount(userId: string): Promise<number>;
  listForUser(
    userId: string,
    options?: number | ListNotificationsOptions
  ): Promise<NotificationItemDto[]>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<boolean>;
  clearAll(userId: string): Promise<void>;
}

export class DatabaseNotificationService implements INotificationService {
  async create({
    userId,
    title,
    message,
    type = "INFO",
    link,
    reminderId,
    metadata,
  }: CreateNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        reminderId,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
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

  async listForUser(
    userId: string,
    options?: number | ListNotificationsOptions
  ): Promise<NotificationItemDto[]> {
    let limit = 20;
    let offset = 0;
    let typeFilter: string | undefined;
    let isReadFilter: boolean | undefined;

    if (typeof options === "number") {
      limit = options;
    } else if (options) {
      if (options.limit !== undefined) limit = options.limit;
      if (options.offset !== undefined) offset = options.offset;
      if (options.type) typeFilter = options.type;
      if (options.isRead !== undefined) isReadFilter = options.isRead;
    }

    const where: Prisma.NotificationWhereInput = { userId };
    if (typeFilter && typeFilter !== "ALL") {
      where.type = typeFilter;
    }
    if (isReadFilter !== undefined) {
      where.isRead = isReadFilter;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        link: true,
        reminderId: true,
        metadata: true,
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

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const res = await prisma.notification.deleteMany({
      where: { id, userId },
    });
    return res.count > 0;
  }

  async clearAll(userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { userId },
    });
  }
}

export const notificationService: INotificationService =
  new DatabaseNotificationService();
