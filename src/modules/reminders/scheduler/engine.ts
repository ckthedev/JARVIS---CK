import { prisma } from "@/lib/prisma/client";
import { startBoss } from "./pgboss-client";
import { calculateNextOccurrence } from "../recurrence";
import { RecurrenceRule, MissedReminderPolicy } from "../types";

export const REMINDER_JOB_NAME = "reminder-process-job";

export class ReminderSchedulerEngine {
  /**
   * Process a single reminder occurrence.
   * Creates notification, records delivery, and handles recurrence or completion.
   */
  async processReminder(
    reminderId: string,
    channel: "IN_APP" | "BROWSER" = "IN_APP"
  ): Promise<boolean> {
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: { include: { settings: true } },
        task: true,
        meeting: true,
      },
    });

    if (!reminder || reminder.deletedAt) {
      return false;
    }

    // Do not re-process completed or cancelled reminders
    if (reminder.status === "COMPLETED" || reminder.status === "CANCELLED") {
      return false;
    }

    const now = new Date();
    const userTimezone = reminder.user.settings?.timezone || "Asia/Kolkata";

    // 1. Compose Notification Content
    let message = reminder.description || "You have a scheduled reminder.";
    if (reminder.meeting) {
      const location = reminder.meeting.location ? ` at ${reminder.meeting.location}` : "";
      message = `Meeting: "${reminder.meeting.title}"${location}`;
      if (reminder.offsetMinutes && reminder.offsetMinutes > 0) {
        message += ` (starts in ${reminder.offsetMinutes} minutes)`;
      }
    } else if (reminder.task) {
      message = `Task Reminder: "${reminder.task.title}" (Priority: ${reminder.task.priority})`;
    }

    // 2. Create in-app Notification
    await prisma.notification.create({
      data: {
        userId: reminder.userId,
        reminderId: reminder.id,
        title: `Reminder: ${reminder.title}`,
        message,
        type: "REMINDER",
        link: `/reminders?id=${reminder.id}`,
        metadata: {
          reminderId: reminder.id,
          priority: reminder.priority,
          taskId: reminder.taskId,
          meetingId: reminder.meetingId,
          dueAt: reminder.dueAt.toISOString(),
        },
      },
    });

    // 3. Create Delivery Record
    await prisma.reminderDelivery.create({
      data: {
        reminderId: reminder.id,
        userId: reminder.userId,
        scheduledAt: reminder.dueAt,
        deliveredAt: now,
        status: "DELIVERED",
        channel,
      },
    });

    // 4. Handle Recurrence or Completion
    if (reminder.isRecurring && reminder.recurrenceRule) {
      const nextDue = calculateNextOccurrence(
        reminder.dueAt,
        {
          rule: reminder.recurrenceRule as RecurrenceRule,
          interval: reminder.recurrenceInterval || 1,
          daysOfWeek: reminder.recurrenceDaysOfWeek,
          dayOfMonth: reminder.recurrenceDayOfMonth,
          month: reminder.recurrenceMonth,
          endDate: reminder.recurrenceEndAt,
          timezone: userTimezone,
        },
        now
      );

      if (nextDue) {
        // Reschedule to next occurrence
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            dueAt: nextDue,
            nextRunAt: nextDue,
            status: "PENDING",
            snoozedUntil: null,
            snoozeCount: 0,
            lastNotifiedAt: now,
          },
        });

        // Queue in pg-boss
        await this.scheduleBossJob(reminder.id, nextDue);
      } else {
        // Recurrence cycle finished
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "COMPLETED",
            isCompleted: true,
            completedAt: now,
            lastNotifiedAt: now,
          },
        });
      }
    } else {
      // One-time reminder: mark as SENT
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: "SENT",
          lastNotifiedAt: now,
        },
      });
    }

    return true;
  }

  /**
   * Check and process all due reminders currently ready to fire.
   */
  async checkDueReminders(): Promise<{ processedCount: number }> {
    const now = new Date();

    // Query active reminders where dueAt or snoozedUntil <= now
    const dueReminders = await prisma.reminder.findMany({
      where: {
        deletedAt: null,
        status: { in: ["PENDING", "SNOOZED"] },
        OR: [
          {
            snoozedUntil: { lte: now },
          },
          {
            snoozedUntil: null,
            dueAt: { lte: now },
          },
        ],
      },
      select: { id: true },
      take: 50,
    });

    let processedCount = 0;
    for (const item of dueReminders) {
      try {
        const success = await this.processReminder(item.id);
        if (success) processedCount++;
      } catch (err) {
        console.error(`Failed to process due reminder ${item.id}:`, err);
      }
    }

    return { processedCount };
  }

  /**
   * Missed Reminder Recovery (Section 8).
   * Runs on application/worker startup.
   * Identifies reminders whose scheduled time passed while the server/worker was offline.
   */
  async recoverMissedReminders(userId?: string): Promise<{
    recoveredCount: number;
    missedIds: string[];
  }> {
    const now = new Date();
    // Consider missed if scheduled time is over 1 minute in the past
    const gracePeriodThreshold = new Date(now.getTime() - 60 * 1000);

    const where: {
      deletedAt: null;
      status: { in: ("PENDING" | "SNOOZED")[] };
      dueAt: { lt: Date };
      userId?: string;
    } = {
      deletedAt: null,
      status: { in: ["PENDING", "SNOOZED"] },
      dueAt: { lt: gracePeriodThreshold },
    };

    if (userId) {
      where.userId = userId;
    }

    const missed = await prisma.reminder.findMany({
      where,
      include: {
        user: { include: { settings: true } },
      },
    });

    const missedIds: string[] = [];

    for (const reminder of missed) {
      try {
        const policy: MissedReminderPolicy =
          (reminder.missedPolicy as MissedReminderPolicy) ||
          (reminder.user.settings?.missedReminderPolicy as MissedReminderPolicy) ||
          "NOTIFY_IMMEDIATELY";

        const userTimezone = reminder.user.settings?.timezone || "Asia/Kolkata";
        const formattedScheduledTime = new Intl.DateTimeFormat("en-US", {
          timeZone: userTimezone,
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(reminder.dueAt);

        if (policy === "NOTIFY_IMMEDIATELY") {
          // Send Missed Notification
          await prisma.notification.create({
            data: {
              userId: reminder.userId,
              reminderId: reminder.id,
              title: `[Missed Reminder] ${reminder.title}`,
              message: `This reminder was scheduled for ${formattedScheduledTime} while the system was offline.`,
              type: "WARNING",
              link: `/reminders?id=${reminder.id}`,
              metadata: {
                missed: true,
                scheduledAt: reminder.dueAt.toISOString(),
                recoveredAt: now.toISOString(),
              },
            },
          });

          // Record Delivery as MISSED
          await prisma.reminderDelivery.create({
            data: {
              reminderId: reminder.id,
              userId: reminder.userId,
              scheduledAt: reminder.dueAt,
              deliveredAt: now,
              status: "MISSED",
              channel: "IN_APP",
            },
          });

          if (reminder.isRecurring && reminder.recurrenceRule) {
            // Advance to next future occurrence
            const nextDue = calculateNextOccurrence(
              reminder.dueAt,
              {
                rule: reminder.recurrenceRule as RecurrenceRule,
                interval: reminder.recurrenceInterval || 1,
                daysOfWeek: reminder.recurrenceDaysOfWeek,
                dayOfMonth: reminder.recurrenceDayOfMonth,
                month: reminder.recurrenceMonth,
                endDate: reminder.recurrenceEndAt,
                timezone: userTimezone,
              },
              now
            );

            if (nextDue) {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  dueAt: nextDue,
                  nextRunAt: nextDue,
                  status: "PENDING",
                  snoozedUntil: null,
                  lastNotifiedAt: now,
                },
              });
              await this.scheduleBossJob(reminder.id, nextDue);
            } else {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  status: "COMPLETED",
                  isCompleted: true,
                  completedAt: now,
                  lastNotifiedAt: now,
                },
              });
            }
          } else {
            // One-time reminder completed as SENT
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: "SENT",
                lastNotifiedAt: now,
              },
            });
          }

          missedIds.push(reminder.id);
        } else if (policy === "SKIP") {
          // Skip notification and advance or cancel
          await prisma.reminderDelivery.create({
            data: {
              reminderId: reminder.id,
              userId: reminder.userId,
              scheduledAt: reminder.dueAt,
              deliveredAt: now,
              status: "MISSED",
              channel: "IN_APP",
              error: "Skipped due to SKIP recovery policy",
            },
          });

          if (reminder.isRecurring && reminder.recurrenceRule) {
            const nextDue = calculateNextOccurrence(
              reminder.dueAt,
              {
                rule: reminder.recurrenceRule as RecurrenceRule,
                interval: reminder.recurrenceInterval || 1,
                daysOfWeek: reminder.recurrenceDaysOfWeek,
                dayOfMonth: reminder.recurrenceDayOfMonth,
                month: reminder.recurrenceMonth,
                endDate: reminder.recurrenceEndAt,
                timezone: userTimezone,
              },
              now
            );

            if (nextDue) {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  dueAt: nextDue,
                  nextRunAt: nextDue,
                  status: "PENDING",
                },
              });
              await this.scheduleBossJob(reminder.id, nextDue);
            } else {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  status: "COMPLETED",
                  isCompleted: true,
                  completedAt: now,
                },
              });
            }
          } else {
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: "CANCELLED",
              },
            });
          }

          missedIds.push(reminder.id);
        }
      } catch (err) {
        console.error(`Error recovering missed reminder ${reminder.id}:`, err);
      }
    }

    return {
      recoveredCount: missedIds.length,
      missedIds,
    };
  }

  /**
   * Schedule job in pg-boss queue.
   */
  async scheduleBossJob(reminderId: string, runAt: Date): Promise<string | null> {
    const boss = await startBoss();
    if (!boss) return null;

    try {
      const jobId = await boss.send(
        REMINDER_JOB_NAME,
        { reminderId, scheduledTime: runAt.toISOString() },
        {
          startAfter: runAt,
          singletonKey: `reminder-${reminderId}`,
          retryLimit: 3,
          retryDelay: 30,
        }
      );

      if (jobId) {
        await prisma.reminder.update({
          where: { id: reminderId },
          data: { jobId },
        });
      }

      return jobId;
    } catch (err) {
      console.error(`[PgBoss] Error scheduling job for reminder ${reminderId}:`, err);
      return null;
    }
  }

  /**
   * Cancel or invalidate job in pg-boss queue.
   */
  async cancelBossJob(jobId: string | null): Promise<void> {
    if (!jobId) return;
    const boss = await startBoss();
    if (!boss) return;

    try {
      // In pg-boss, cancel takes queue and jobId
      await boss.cancel(REMINDER_JOB_NAME, jobId);
    } catch {
      // Ignore if job already executed or not found
    }
  }
}

export const schedulerEngine = new ReminderSchedulerEngine();
