import { prisma } from "@/lib/prisma/client";
import { Prisma, Reminder } from "@prisma/client";
import {
  ReminderDto,
  ReminderFilters,
  ReminderStats,
  ReminderPriority,
  ReminderStatus,
  RecurrenceRule,
} from "./types";
import {
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeReminderInput,
} from "@/lib/validations/reminder";
import { schedulerEngine } from "./scheduler/engine";
import { getKolkataDateParts } from "@/lib/utils/timezone";

export class ReminderService {
  /**
   * Query reminders with advanced filtering, sections, search, and sorting.
   */
  async getReminders(userId: string, filters: ReminderFilters = {}): Promise<ReminderDto[]> {
    const {
      section = "all",
      search,
      priority,
      status,
      isRecurring,
      taskId,
      meetingId,
      sortBy = "dueAt",
      sortOrder = "asc",
      page,
      limit,
    } = filters;

    const where: Prisma.ReminderWhereInput = {
      userId,
      deletedAt: null,
    };

    // Timezone-aware date calculations for Today/Upcoming/Overdue
    const todayParts = getKolkataDateParts();
    const startOfToday = new Date(`${todayParts.dateString}T00:00:00+05:30`);
    const endOfToday = new Date(`${todayParts.dateString}T23:59:59.999+05:30`);
    const now = new Date();

    // Section filtering
    switch (section) {
      case "all":
        // Shows active (non-deleted) reminders
        break;
      case "today":
        where.status = { notIn: ["COMPLETED", "CANCELLED"] };
        where.dueAt = {
          gte: startOfToday,
          lte: endOfToday,
        };
        break;
      case "upcoming":
        where.status = { notIn: ["COMPLETED", "CANCELLED"] };
        where.dueAt = {
          gt: endOfToday,
        };
        break;
      case "overdue":
        where.status = { in: ["PENDING", "SNOOZED"] };
        where.dueAt = {
          lt: now,
        };
        break;
      case "recurring":
        where.isRecurring = true;
        break;
      case "completed":
        where.status = "COMPLETED";
        break;
      case "cancelled":
        where.status = "CANCELLED";
        break;
    }

    // Direct filter overrides
    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (isRecurring !== undefined) {
      where.isRecurring = isRecurring;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (meetingId) {
      where.meetingId = meetingId;
    }

    // Search query across title and description
    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    // Sorting
    const orderBy: Prisma.ReminderOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "priority":
        orderBy.push({ priority: sortOrder });
        break;
      case "createdAt":
        orderBy.push({ createdAt: sortOrder });
        break;
      case "title":
        orderBy.push({ title: sortOrder });
        break;
      case "dueAt":
      default:
        orderBy.push({ dueAt: sortOrder });
        break;
    }

    const take = limit && limit > 0 ? limit : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true,
            status: true,
          },
        },
        _count: {
          select: { deliveries: true },
        },
      },
    });

    return reminders.map((r) => this.mapToDto(r));
  }

  /**
   * Get single reminder with ownership validation.
   */
  async getReminderById(userId: string, id: string): Promise<ReminderDto | null> {
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        meeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            location: true,
            status: true,
          },
        },
        _count: {
          select: { deliveries: true },
        },
      },
    });

    if (!reminder) return null;
    return this.mapToDto(reminder);
  }

  /**
   * Create a new reminder.
   */
  async createReminder(userId: string, input: CreateReminderInput): Promise<ReminderDto> {
    let dueAt = new Date(input.dueAt);

    // Validate Task ownership if taskId provided
    if (input.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: input.taskId, userId },
      });
      if (!task) {
        throw new Error("Specified task not found or unauthorized");
      }
    }

    // Validate Meeting ownership and calculate offset if meetingId provided
    if (input.meetingId) {
      const meeting = await prisma.meeting.findFirst({
        where: { id: input.meetingId, userId },
      });
      if (!meeting) {
        throw new Error("Specified meeting not found or unauthorized");
      }
      if (input.offsetMinutes !== undefined && input.offsetMinutes !== null) {
        dueAt = new Date(meeting.startTime.getTime() - input.offsetMinutes * 60 * 1000);
      }
    }

    const priority = input.priority || "NORMAL";
    const isRecurring = Boolean(input.isRecurring && input.recurrenceRule);

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        taskId: input.taskId || null,
        meetingId: input.meetingId || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        dueAt,
        priority,
        status: "PENDING",
        isCompleted: false,
        isRecurring,
        recurrenceRule: isRecurring ? input.recurrenceRule : null,
        recurrenceInterval: input.recurrenceInterval || 1,
        recurrenceDaysOfWeek: input.recurrenceDaysOfWeek || [],
        recurrenceDayOfMonth: input.recurrenceDayOfMonth || null,
        recurrenceMonth: input.recurrenceMonth || null,
        recurrenceEndAt: input.recurrenceEndAt ? new Date(input.recurrenceEndAt) : null,
        nextRunAt: isRecurring ? dueAt : null,
        offsetMinutes: input.offsetMinutes || null,
        missedPolicy: input.missedPolicy || "NOTIFY_IMMEDIATELY",
      },
      include: {
        task: true,
        meeting: true,
        _count: { select: { deliveries: true } },
      },
    });

    // Schedule job in background scheduler
    await schedulerEngine.scheduleBossJob(reminder.id, dueAt);

    return this.mapToDto(reminder);
  }

  /**
   * Update reminder fields.
   */
  async updateReminder(
    userId: string,
    id: string,
    input: UpdateReminderInput
  ): Promise<ReminderDto> {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Reminder not found or unauthorized");
    }

    const data: Prisma.ReminderUpdateInput = {};

    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === "COMPLETED") {
        data.isCompleted = true;
        data.completedAt = new Date();
      } else if (input.status === "PENDING") {
        data.isCompleted = false;
        data.completedAt = null;
      }
    }

    if (input.isRecurring !== undefined) {
      data.isRecurring = input.isRecurring;
    }
    if (input.recurrenceRule !== undefined) {
      data.recurrenceRule = input.recurrenceRule;
    }
    if (input.recurrenceInterval !== undefined) {
      data.recurrenceInterval = input.recurrenceInterval;
    }
    if (input.recurrenceDaysOfWeek !== undefined) {
      data.recurrenceDaysOfWeek = input.recurrenceDaysOfWeek;
    }
    if (input.recurrenceDayOfMonth !== undefined) {
      data.recurrenceDayOfMonth = input.recurrenceDayOfMonth;
    }
    if (input.recurrenceMonth !== undefined) {
      data.recurrenceMonth = input.recurrenceMonth;
    }
    if (input.recurrenceEndAt !== undefined) {
      data.recurrenceEndAt = input.recurrenceEndAt ? new Date(input.recurrenceEndAt) : null;
    }
    if (input.missedPolicy !== undefined) {
      data.missedPolicy = input.missedPolicy;
    }

    let scheduleRescheduled = false;
    let newDueAt = existing.dueAt;

    if (input.dueAt !== undefined) {
      newDueAt = new Date(input.dueAt);
      data.dueAt = newDueAt;
      data.nextRunAt = newDueAt;
      scheduleRescheduled = true;
    }

    // Handle meeting link & offset
    if (input.meetingId !== undefined) {
      data.meeting = input.meetingId ? { connect: { id: input.meetingId } } : { disconnect: true };
    }
    if (input.taskId !== undefined) {
      data.task = input.taskId ? { connect: { id: input.taskId } } : { disconnect: true };
    }
    if (input.offsetMinutes !== undefined) {
      data.offsetMinutes = input.offsetMinutes;
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data,
      include: {
        task: true,
        meeting: true,
        _count: { select: { deliveries: true } },
      },
    });

    if (scheduleRescheduled) {
      await schedulerEngine.cancelBossJob(existing.jobId);
      await schedulerEngine.scheduleBossJob(id, newDueAt);
    }

    return this.mapToDto(updated);
  }

  /**
   * Snooze reminder for N minutes or until a custom timestamp.
   */
  async snoozeReminder(
    userId: string,
    id: string,
    input: SnoozeReminderInput
  ): Promise<ReminderDto> {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Reminder not found or unauthorized");
    }

    let snoozedUntil: Date;
    if (input.durationMinutes) {
      snoozedUntil = new Date(Date.now() + input.durationMinutes * 60 * 1000);
    } else if (input.customDate) {
      snoozedUntil = new Date(input.customDate);
    } else {
      snoozedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min fallback
    }

    // Cancel existing job
    await schedulerEngine.cancelBossJob(existing.jobId);

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: "SNOOZED",
        snoozedUntil,
        snoozeCount: { increment: 1 },
      },
      include: {
        task: true,
        meeting: true,
        _count: { select: { deliveries: true } },
      },
    });

    // Record delivery status as SNOOZED
    await prisma.reminderDelivery.create({
      data: {
        reminderId: id,
        userId,
        scheduledAt: existing.dueAt,
        deliveredAt: new Date(),
        status: "SNOOZED",
        channel: "IN_APP",
      },
    });

    // Schedule new job for snoozed timestamp
    await schedulerEngine.scheduleBossJob(id, snoozedUntil);

    return this.mapToDto(updated);
  }

  /**
   * Mark reminder completed.
   */
  async completeReminder(userId: string, id: string): Promise<ReminderDto> {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Reminder not found or unauthorized");
    }

    await schedulerEngine.cancelBossJob(existing.jobId);

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: "COMPLETED",
        isCompleted: true,
        completedAt: new Date(),
      },
      include: {
        task: true,
        meeting: true,
        _count: { select: { deliveries: true } },
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Cancel reminder.
   */
  async cancelReminder(userId: string, id: string): Promise<ReminderDto> {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Reminder not found or unauthorized");
    }

    await schedulerEngine.cancelBossJob(existing.jobId);

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
      include: {
        task: true,
        meeting: true,
        _count: { select: { deliveries: true } },
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Reactivate completed or cancelled reminder.
   */
  async reactivateReminder(userId: string, id: string): Promise<ReminderDto> {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error("Reminder not found or unauthorized");
    }

    let dueAt = existing.dueAt;
    const now = new Date();
    // If original due date is in the past, reschedule to 1 hour from now
    if (dueAt.getTime() <= now.getTime()) {
      dueAt = new Date(now.getTime() + 60 * 60 * 1000);
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: "PENDING",
        isCompleted: false,
        completedAt: null,
        dueAt,
        snoozedUntil: null,
      },
      include: {
        task: true,
        meeting: true,
        _count: { select: { deliveries: true } },
      },
    });

    await schedulerEngine.scheduleBossJob(id, dueAt);

    return this.mapToDto(updated);
  }

  /**
   * Delete reminder (soft-delete by default, permanent if requested).
   */
  async deleteReminder(
    userId: string,
    id: string,
    permanent = false
  ): Promise<boolean> {
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error("Reminder not found or unauthorized");
    }

    await schedulerEngine.cancelBossJob(existing.jobId);

    if (permanent) {
      await prisma.reminderDelivery.deleteMany({ where: { reminderId: id } });
      await prisma.notification.deleteMany({ where: { reminderId: id } });
      await prisma.reminder.delete({ where: { id } });
    } else {
      await prisma.reminder.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    return true;
  }

  /**
   * Compute comprehensive dashboard and section counts.
   */
  async getReminderStats(userId: string): Promise<ReminderStats> {
    const todayParts = getKolkataDateParts();
    const startOfToday = new Date(`${todayParts.dateString}T00:00:00+05:30`);
    const endOfToday = new Date(`${todayParts.dateString}T23:59:59.999+05:30`);
    const now = new Date();

    const [
      total,
      today,
      upcoming,
      overdue,
      recurring,
      completed,
      cancelled,
      snoozed,
    ] = await Promise.all([
      prisma.reminder.count({ where: { userId, deletedAt: null } }),
      prisma.reminder.count({
        where: {
          userId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.reminder.count({
        where: {
          userId,
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          dueAt: { gt: endOfToday },
        },
      }),
      prisma.reminder.count({
        where: {
          userId,
          deletedAt: null,
          status: { in: ["PENDING", "SNOOZED"] },
          dueAt: { lt: now },
        },
      }),
      prisma.reminder.count({
        where: { userId, deletedAt: null, isRecurring: true },
      }),
      prisma.reminder.count({
        where: { userId, deletedAt: null, status: "COMPLETED" },
      }),
      prisma.reminder.count({
        where: { userId, deletedAt: null, status: "CANCELLED" },
      }),
      prisma.reminder.count({
        where: { userId, deletedAt: null, status: "SNOOZED" },
      }),
    ]);

    return {
      total,
      today,
      upcoming,
      overdue,
      recurring,
      completed,
      cancelled,
      snoozed,
    };
  }

  // ===========================================================================
  // MEETING & TASK INTEGRATION EVENT HANDLERS
  // ===========================================================================

  /**
   * When a meeting time changes, update linked reminder schedules.
   */
  async handleMeetingRescheduled(meetingId: string, newStartTime: Date): Promise<void> {
    const reminders = await prisma.reminder.findMany({
      where: { meetingId, deletedAt: null, status: "PENDING" },
    });

    for (const r of reminders) {
      const offset = r.offsetMinutes || 0;
      const newDue = new Date(newStartTime.getTime() - offset * 60 * 1000);

      await prisma.reminder.update({
        where: { id: r.id },
        data: { dueAt: newDue, nextRunAt: newDue },
      });

      await schedulerEngine.cancelBossJob(r.jobId);
      await schedulerEngine.scheduleBossJob(r.id, newDue);
    }
  }

  /**
   * When a meeting is cancelled, cancel outstanding meeting reminders.
   */
  async handleMeetingCancelled(meetingId: string): Promise<void> {
    const reminders = await prisma.reminder.findMany({
      where: { meetingId, deletedAt: null, status: { in: ["PENDING", "SNOOZED"] } },
    });

    for (const r of reminders) {
      await schedulerEngine.cancelBossJob(r.jobId);
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "CANCELLED" },
      });
    }
  }

  /**
   * When a task is completed, optionally cancel pending task reminders.
   */
  async handleTaskCompleted(taskId: string, cancelOutstanding = false): Promise<void> {
    if (!cancelOutstanding) return;

    const reminders = await prisma.reminder.findMany({
      where: { taskId, deletedAt: null, status: "PENDING" },
    });

    for (const r of reminders) {
      await schedulerEngine.cancelBossJob(r.jobId);
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "CANCELLED" },
      });
    }
  }

  // ===========================================================================
  // BACKWARD COMPATIBILITY
  // ===========================================================================

  async getUpcomingReminders(userId: string, limit = 5): Promise<ReminderDto[]> {
    return this.getReminders(userId, {
      section: "upcoming",
      limit,
    });
  }

  async getPendingCount(userId: string): Promise<number> {
    return await prisma.reminder.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: ["PENDING", "SNOOZED"] },
      },
    });
  }

  // ===========================================================================
  // PRIVATE MAPPER
  // ===========================================================================

  private mapToDto(
    r: Reminder & {
      task?: { id: string; title: string; status: string; priority: string; dueDate: Date | null } | null;
      meeting?: { id: string; title: string; startTime: Date; endTime: Date; location: string | null; status: string } | null;
      _count?: { deliveries: number };
    }
  ): ReminderDto {
    return {
      id: r.id,
      userId: r.userId,
      taskId: r.taskId,
      meetingId: r.meetingId,
      title: r.title,
      description: r.description,
      dueAt: r.dueAt,
      isCompleted: r.isCompleted,
      status: r.status as ReminderStatus,
      priority: (r.priority as ReminderPriority) || "NORMAL",
      isRecurring: r.isRecurring,
      recurrenceRule: r.recurrenceRule as RecurrenceRule | null,
      recurrenceInterval: r.recurrenceInterval || 1,
      recurrenceDaysOfWeek: r.recurrenceDaysOfWeek,
      recurrenceDayOfMonth: r.recurrenceDayOfMonth,
      recurrenceMonth: r.recurrenceMonth,
      recurrenceEndAt: r.recurrenceEndAt,
      nextRunAt: r.nextRunAt,
      offsetMinutes: r.offsetMinutes,
      snoozedUntil: r.snoozedUntil,
      snoozeCount: r.snoozeCount,
      lastNotifiedAt: r.lastNotifiedAt,
      completedAt: r.completedAt,
      deletedAt: r.deletedAt,
      missedPolicy: (r.missedPolicy as "NOTIFY_IMMEDIATELY" | "SKIP") || "NOTIFY_IMMEDIATELY",
      jobId: r.jobId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      task: r.task || null,
      meeting: r.meeting || null,
      deliveriesCount: r._count?.deliveries || 0,
    };
  }
}

export const reminderService = new ReminderService();
