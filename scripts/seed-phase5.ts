import { prisma } from "../src/lib/prisma/client";
import { reminderService } from "../src/modules/reminders/service";

async function seedPhase5() {
  console.log("Seeding realistic sample data for Phase 5 (Reminders & Notifications)...");

  const user = await prisma.user.findFirst({
    where: { email: "ck@jarvis.local" },
  });

  if (!user) {
    console.error("Admin user ck@jarvis.local not found!");
    return;
  }

  // 1. Ensure user settings exist
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {
      timezone: "Asia/Kolkata",
      soundEnabled: true,
      soundTheme: "subtle",
      defaultSnoozeMinutes: 10,
      missedReminderPolicy: "NOTIFY_IMMEDIATELY",
      notificationBrowser: true,
    },
    create: {
      userId: user.id,
      timezone: "Asia/Kolkata",
      soundEnabled: true,
      soundTheme: "subtle",
      defaultSnoozeMinutes: 10,
      missedReminderPolicy: "NOTIFY_IMMEDIATELY",
      notificationBrowser: true,
    },
  });

  // 2. Fetch existing active tasks and meetings
  const activeTask = await prisma.task.findFirst({
    where: { userId: user.id, status: { in: ["TODO", "IN_PROGRESS"] } },
  });

  const activeMeeting = await prisma.meeting.findFirst({
    where: { userId: user.id, status: "SCHEDULED" },
  });

  const now = new Date();

  // Reminder 1: Today morning standup briefing (Daily recurring)
  const todayDue = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  await reminderService.createReminder(user.id, {
    title: "Daily Standup: Engineering & Architecture sync",
    description: "Review system performance telemetry, background worker health, and security boundaries.",
    dueAt: todayDue.toISOString(),
    priority: "HIGH",
    isRecurring: true,
    recurrenceRule: "DAILY",
    recurrenceInterval: 1,
  });

  // Reminder 2: Task-linked reminder
  if (activeTask) {
    const taskDue = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    await reminderService.createReminder(user.id, {
      title: `Task checkpoint: ${activeTask.title}`,
      description: "Follow up on active development deliverables and verify database indexes.",
      dueAt: taskDue.toISOString(),
      priority: "CRITICAL",
      taskId: activeTask.id,
    });
  }

  // Reminder 3: Meeting-linked reminder
  if (activeMeeting) {
    await reminderService.createReminder(user.id, {
      title: `Meeting alert: ${activeMeeting.title}`,
      description: "Prepare meeting agenda notes and telemetry dashboard slides.",
      dueAt: activeMeeting.startTime.toISOString(),
      meetingId: activeMeeting.id,
      offsetMinutes: 15,
      priority: "HIGH",
    });
  }

  // Reminder 4: Upcoming weekly reminder
  const weeklyDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  await reminderService.createReminder(user.id, {
    title: "Weekly PostgreSQL Database Backup & Index Vacuum",
    description: "Run automated snapshot export and inspect pg_stat_activity metrics.",
    dueAt: weeklyDue.toISOString(),
    priority: "NORMAL",
    isRecurring: true,
    recurrenceRule: "WEEKLY",
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: [1, 3, 5],
  });

  // Reminder 5: Completed reminder
  const pastCompleted = await reminderService.createReminder(user.id, {
    title: "Configure JARVIS Phase 5 Reminder Engine",
    description: "pg-boss integration, recurrence calculations, and notification center.",
    dueAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    priority: "HIGH",
  });
  await reminderService.completeReminder(user.id, pastCompleted.id);

  // 3. Create Sample in-app Notifications for rich activity inbox
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: "Phase 5 Reminders & Notifications Engine Activated",
        message: "The background queue and in-app Notification Center are now live with real-time alerting.",
        type: "SYSTEM",
        link: "/reminders",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Storage Engine Operational",
        message: "Encrypted file storage repository data/uploads verified with zero path traversal vulnerabilities.",
        type: "INFO",
        link: "/files",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Daily Standup Meeting Scheduled",
        message: "Your Engineering & Architecture sync is scheduled for today.",
        type: "MEETING",
        link: "/meetings",
        isRead: true,
      },
    ],
  });

  console.log("Phase 5 sample reminders and notifications successfully seeded.");
}

seedPhase5()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
