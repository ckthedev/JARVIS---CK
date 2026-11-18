import { prisma } from "../src/lib/prisma/client";
import { reminderService } from "../src/modules/reminders/service";
import { schedulerEngine } from "../src/modules/reminders/scheduler/engine";
import { stopBoss } from "../src/modules/reminders/scheduler/pgboss-client";
import { notificationService } from "../src/lib/notifications";
import {
  calculateNextOccurrence,
  getDaysInMonth,
  isLeapYear,
} from "../src/modules/reminders/recurrence";

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`[PASS] ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`[FAIL] ${name}${details ? ` - ${details}` : ""}`);
  }
}

async function runTests() {
  console.log("================================================================");
  console.log("   JARVIS PHASE 5: REMINDERS & NOTIFICATIONS TEST SUITE");
  console.log("================================================================\n");

  // Fetch Admin User
  const user = await prisma.user.findFirst({
    where: { email: "ck@jarvis.local" },
  });

  if (!user) {
    throw new Error("Admin user ck@jarvis.local not found in PostgreSQL database!");
  }
  console.log(`Executing test suite for user: ${user.name} (${user.email}, id: ${user.id})\n`);

  // Clean test fixtures
  console.log("Cleaning previous reminder test fixtures...");
  await prisma.reminderDelivery.deleteMany({ where: { userId: user.id } });
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.reminder.deleteMany({ where: { userId: user.id } });

  // ===========================================================================
  // TEST GROUP 1: RECURRENCE ENGINE ALGORITHMS
  // ===========================================================================
  console.log("\n--- TEST GROUP 1: Recurrence Engine Unit Calculations ---");

  // 1.1 Leap Year calculation
  assert(isLeapYear(2024) === true, "1.1 Leap year: 2024 is a leap year");
  assert(isLeapYear(2026) === false, "1.2 Leap year: 2026 is not a leap year");
  assert(isLeapYear(2000) === true, "1.3 Leap year: 2000 is a leap year (divisible by 400)");
  assert(isLeapYear(1900) === false, "1.4 Leap year: 1900 is not a leap year (century not div by 400)");

  // 1.5 Days in month calculation & clamping
  assert(getDaysInMonth(2024, 2) === 29, "1.5 February 2024 has 29 days");
  assert(getDaysInMonth(2026, 2) === 28, "1.6 February 2026 has 28 days");
  assert(getDaysInMonth(2026, 4) === 30, "1.7 April 2026 has 30 days");
  assert(getDaysInMonth(2026, 1) === 31, "1.8 January 2026 has 31 days");

  // 1.9 Daily recurrence calculation
  const baseDate = new Date("2026-06-15T09:00:00.000Z");
  const nextDaily = calculateNextOccurrence(baseDate, {
    rule: "DAILY",
    interval: 2,
    timezone: "UTC",
  });
  assert(
    nextDaily !== null && nextDaily.toISOString() === "2026-06-17T09:00:00.000Z",
    "1.9 Daily recurrence advances by interval (2 days)",
    `Expected 2026-06-17T09:00:00.000Z, got ${nextDaily?.toISOString()}`
  );

  // 1.10 Weekly recurrence calculation
  // 2026-06-15 is a Monday (day 1). Target weekdays: Wednesday (3), Friday (5)
  const nextWeekly = calculateNextOccurrence(baseDate, {
    rule: "WEEKLY",
    interval: 1,
    daysOfWeek: [3, 5],
    timezone: "UTC",
  });
  // Next occurrence should be Wednesday June 17, 2026
  assert(
    nextWeekly !== null &&
      nextWeekly.getUTCDay() === 3 &&
      nextWeekly.getUTCDate() === 17,
    "1.10 Weekly recurrence advances to next specified weekday (Wednesday)",
    `Got ${nextWeekly?.toISOString()}`
  );

  // 1.11 Monthly recurrence with day clamping
  // January 31, 2026 -> February 28, 2026 (clamped)
  const jan31 = new Date("2026-01-31T10:00:00.000Z");
  const febClamped = calculateNextOccurrence(jan31, {
    rule: "MONTHLY",
    interval: 1,
    dayOfMonth: 31,
    timezone: "UTC",
  });
  assert(
    febClamped !== null &&
      febClamped.getUTCMonth() === 1 && // Feb
      febClamped.getUTCDate() === 28,
    "1.11 Monthly recurrence clamps Jan 31st to Feb 28th on non-leap year",
    `Got ${febClamped?.toISOString()}`
  );

  // 1.12 Yearly recurrence with leap year clamping
  // Feb 29, 2024 -> Feb 28, 2025
  const feb29_2024 = new Date("2024-02-29T12:00:00.000Z");
  const yearlyClamped = calculateNextOccurrence(feb29_2024, {
    rule: "YEARLY",
    interval: 1,
    dayOfMonth: 29,
    month: 2,
    timezone: "UTC",
  });
  assert(
    yearlyClamped !== null &&
      yearlyClamped.getUTCFullYear() === 2025 &&
      yearlyClamped.getUTCMonth() === 1 &&
      yearlyClamped.getUTCDate() === 28,
    "1.12 Yearly recurrence clamps Feb 29 leap day to Feb 28 on following year",
    `Got ${yearlyClamped?.toISOString()}`
  );

  // 1.13 Recurrence respect end date
  const endLimit = new Date("2026-06-20T00:00:00.000Z");
  const pastEnd = calculateNextOccurrence(new Date("2026-06-19T10:00:00.000Z"), {
    rule: "DAILY",
    interval: 3,
    endDate: endLimit,
    timezone: "UTC",
  });
  assert(
    pastEnd === null,
    "1.13 Recurrence terminates when occurrence exceeds endAt limit"
  );
  assert(
    pastEnd === null,
    "1.13 Recurrence terminates when occurrence exceeds endAt limit"
  );

  // ===========================================================================
  // TEST GROUP 2: REMINDER CREATION & QUERYING
  // ===========================================================================
  console.log("\n--- TEST GROUP 2: Reminder Creation & Filtering ---");

  // 2.1 One-time reminder creation
  const futureDue = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
  const reminder1 = await reminderService.createReminder(user.id, {
    title: "Review quarterly security telemetry",
    description: "Verify all intrusion detection logs for the month",
    dueAt: futureDue.toISOString(),
    priority: "HIGH",
  });
  assert(
    reminder1.title === "Review quarterly security telemetry" &&
      reminder1.priority === "HIGH" &&
      reminder1.status === "PENDING" &&
      !reminder1.isRecurring,
    "2.1 Create one-time reminder with HIGH priority and PENDING status"
  );

  // 2.2 Critical priority one-time reminder
  const criticalDue = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const reminder2 = await reminderService.createReminder(user.id, {
    title: "Critical server kernel patch",
    dueAt: criticalDue.toISOString(),
    priority: "CRITICAL",
  });
  assert(
    reminder2.priority === "CRITICAL" && reminder2.status === "PENDING",
    "2.2 Create CRITICAL priority reminder"
  );

  // 2.3 Daily recurring reminder
  const dailyReminder = await reminderService.createReminder(user.id, {
    title: "Daily morning standup briefing",
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    priority: "NORMAL",
    isRecurring: true,
    recurrenceRule: "DAILY",
    recurrenceInterval: 1,
  });
  assert(
    dailyReminder.isRecurring &&
      dailyReminder.recurrenceRule === "DAILY" &&
      dailyReminder.recurrenceInterval === 1,
    "2.3 Create daily recurring reminder"
  );

  // 2.4 Weekly recurring reminder with multiple days
  const weeklyReminder = await reminderService.createReminder(user.id, {
    title: "Tri-weekly gym workout reminder",
    dueAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    isRecurring: true,
    recurrenceRule: "WEEKLY",
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: [1, 3, 5], // Mon, Wed, Fri
  });
  assert(
    weeklyReminder.isRecurring &&
      weeklyReminder.recurrenceRule === "WEEKLY" &&
      weeklyReminder.recurrenceDaysOfWeek?.length === 3,
    "2.4 Create weekly recurring reminder with Mon/Wed/Fri schedule"
  );

  // 2.5 Filter by priority
  const criticalList = await reminderService.getReminders(user.id, {
    priority: "CRITICAL",
  });
  assert(
    criticalList.length === 1 && criticalList[0].id === reminder2.id,
    "2.5 Query reminders filtered by CRITICAL priority"
  );

  // 2.6 Filter by recurring status
  const recurringList = await reminderService.getReminders(user.id, {
    isRecurring: true,
  });
  assert(
    recurringList.length === 2,
    "2.6 Query reminders filtered by isRecurring=true (returns 2 recurring reminders)"
  );

  // 2.7 Search by keyword
  const searchResults = await reminderService.getReminders(user.id, {
    search: "security telemetry",
  });
  assert(
    searchResults.length === 1 && searchResults[0].id === reminder1.id,
    "2.7 Search reminders by full-text title / description query"
  );

  // ===========================================================================
  // TEST GROUP 3: TASK & MEETING INTEGRATIONS
  // ===========================================================================
  console.log("\n--- TEST GROUP 3: Task & Meeting Integrations ---");

  // 3.1 Link reminder to Task
  const testTask = await prisma.task.create({
    data: {
      userId: user.id,
      title: "Deploy Phase 5 to production",
      status: "TODO",
      priority: "CRITICAL",
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  const taskReminder = await reminderService.createReminder(user.id, {
    title: "Follow up on task: Deploy Phase 5 to production",
    dueAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    taskId: testTask.id,
    priority: "HIGH",
  });
  assert(
    taskReminder.taskId === testTask.id &&
      taskReminder.task?.title === "Deploy Phase 5 to production",
    "3.1 Reminder correctly links to Task and hydrates task entity details"
  );

  // 3.2 Task deletion preserves reminder with taskId nullified
  await prisma.task.delete({ where: { id: testTask.id } });
  const reminderAfterTaskDelete = await reminderService.getReminderById(
    user.id,
    taskReminder.id
  );
  assert(
    reminderAfterTaskDelete !== null && reminderAfterTaskDelete.taskId === null,
    "3.2 Task deletion safely preserves reminder record with taskId nullified"
  );

  // 3.3 Link reminder to Meeting with 15-minute offset
  const meetingStartTime = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const testMeeting = await prisma.meeting.create({
    data: {
      userId: user.id,
      title: "Architecture Strategy Review",
      startTime: meetingStartTime,
      endTime: new Date(meetingStartTime.getTime() + 60 * 60 * 1000),
      status: "SCHEDULED",
    },
  });

  const meetingReminder = await reminderService.createReminder(user.id, {
    title: "Prep notes for Architecture Review",
    dueAt: meetingStartTime.toISOString(),
    meetingId: testMeeting.id,
    offsetMinutes: 15,
  });

  const expectedMeetingDue = new Date(meetingStartTime.getTime() - 15 * 60 * 1000);
  assert(
    meetingReminder.meetingId === testMeeting.id &&
      meetingReminder.offsetMinutes === 15 &&
      Math.abs(new Date(meetingReminder.dueAt).getTime() - expectedMeetingDue.getTime()) < 1000,
    "3.3 Reminder correctly links to Meeting and calculates dueAt offset by -15 minutes"
  );

  // 3.4 Meeting rescheduling automatically updates reminder schedule
  const newMeetingStartTime = new Date(Date.now() + 5 * 60 * 60 * 1000);
  await reminderService.handleMeetingRescheduled(testMeeting.id, newMeetingStartTime);
  const rescheduledReminder = await reminderService.getReminderById(
    user.id,
    meetingReminder.id
  );
  const expectedNewDue = new Date(newMeetingStartTime.getTime() - 15 * 60 * 1000);
  assert(
    rescheduledReminder !== null &&
      Math.abs(new Date(rescheduledReminder.dueAt).getTime() - expectedNewDue.getTime()) < 1000,
    "3.4 Rescheduling meeting propagates new due time to linked reminder"
  );

  // 3.5 Meeting cancellation cancels linked reminder
  await reminderService.handleMeetingCancelled(testMeeting.id);
  const cancelledMeetingReminder = await reminderService.getReminderById(
    user.id,
    meetingReminder.id
  );
  assert(
    cancelledMeetingReminder?.status === "CANCELLED",
    "3.5 Cancelling meeting automatically cancels linked reminder"
  );

  // ===========================================================================
  // TEST GROUP 4: LIFECYCLE TRANSITIONS
  // ===========================================================================
  console.log("\n--- TEST GROUP 4: Lifecycle Transitions (Snooze, Complete, Reactivate, Delete) ---");

  // 4.1 Snooze reminder by 15 minutes
  const snoozedReminder = await reminderService.snoozeReminder(user.id, reminder1.id, {
    durationMinutes: 15,
  });
  assert(
    snoozedReminder.status === "SNOOZED" &&
      snoozedReminder.snoozeCount === 1 &&
      snoozedReminder.snoozedUntil !== null,
    "4.1 Snooze reminder updates status to SNOOZED and increments snoozeCount"
  );

  // 4.2 Verify snooze delivery record
  const snoozeDeliveries = await prisma.reminderDelivery.findMany({
    where: { reminderId: reminder1.id, status: "SNOOZED" },
  });
  assert(
    snoozeDeliveries.length === 1,
    "4.2 Reminder snooze delivery logged in reminder_deliveries table"
  );

  // 4.3 Complete reminder
  const completedReminder = await reminderService.completeReminder(user.id, reminder1.id);
  assert(
    completedReminder.status === "COMPLETED" &&
      completedReminder.isCompleted === true &&
      completedReminder.completedAt !== null,
    "4.3 Mark reminder COMPLETED sets completedAt and isCompleted=true"
  );

  // 4.4 Reactivate reminder
  const reactivatedReminder = await reminderService.reactivateReminder(user.id, reminder1.id);
  assert(
    reactivatedReminder.status === "PENDING" &&
      reactivatedReminder.isCompleted === false &&
      reactivatedReminder.completedAt === null,
    "4.4 Reactivate reminder restores status to PENDING and clears completedAt"
  );

  // 4.5 Cancel reminder
  const manuallyCancelled = await reminderService.cancelReminder(user.id, reminder2.id);
  assert(
    manuallyCancelled.status === "CANCELLED",
    "4.5 Cancel reminder updates status to CANCELLED"
  );

  // 4.6 Soft delete reminder
  await reminderService.deleteReminder(user.id, manuallyCancelled.id, false);
  const softDeleted = await prisma.reminder.findUnique({
    where: { id: manuallyCancelled.id },
  });
  assert(
    softDeleted !== null && softDeleted.deletedAt !== null,
    "4.6 Soft-delete marks reminder with deletedAt timestamp"
  );

  // 4.7 Exclude soft-deleted from normal listings
  const activeList = await reminderService.getReminders(user.id);
  assert(
    !activeList.some((r) => r.id === manuallyCancelled.id),
    "4.7 Soft-deleted reminder excluded from standard getReminders query"
  );

  // 4.8 Permanent delete
  await reminderService.deleteReminder(user.id, manuallyCancelled.id, true);
  const permanentlyDeleted = await prisma.reminder.findUnique({
    where: { id: manuallyCancelled.id },
  });
  assert(
    permanentlyDeleted === null,
    "4.8 Permanent delete cleanly purges reminder from database"
  );

  // ===========================================================================
  // TEST GROUP 5: SCHEDULER ENGINE & BACKGROUND PROCESSING
  // ===========================================================================
  console.log("\n--- TEST GROUP 5: Background Processing & Recurrence Advances ---");

  // 5.1 Create a due reminder in the past
  const pastDueTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
  const dueReminder = await prisma.reminder.create({
    data: {
      userId: user.id,
      title: "Water office indoor plants",
      dueAt: pastDueTime,
      priority: "NORMAL",
      status: "PENDING",
      isRecurring: false,
      missedPolicy: "NOTIFY_IMMEDIATELY",
    },
  });

  // Process reminder
  const processResult = await schedulerEngine.processReminder(dueReminder.id);
  assert(processResult === true, "5.1 Scheduler successfully processes due reminder");

  // Verify non-recurring reminder status changed to SENT
  const processedReminder = await prisma.reminder.findUnique({
    where: { id: dueReminder.id },
  });
  assert(
    processedReminder?.status === "SENT" && processedReminder.lastNotifiedAt !== null,
    "5.2 Non-recurring reminder transitioned to SENT with lastNotifiedAt timestamp"
  );

  // Verify in-app Notification was created
  const inAppNotifications = await prisma.notification.findMany({
    where: { reminderId: dueReminder.id },
  });
  assert(
    inAppNotifications.length === 1 &&
      inAppNotifications[0].title === "Reminder: Water office indoor plants" &&
      inAppNotifications[0].type === "REMINDER",
    "5.3 In-app Notification generated for processed reminder"
  );

  // Verify delivery record
  const deliveries = await prisma.reminderDelivery.findMany({
    where: { reminderId: dueReminder.id, status: "DELIVERED" },
  });
  assert(
    deliveries.length === 1,
    "5.4 Delivery record created with DELIVERED status"
  );

  // 5.5 Recurring reminder advance on process
  const pastRecurring = await prisma.reminder.create({
    data: {
      userId: user.id,
      title: "Daily hydration check",
      dueAt: pastDueTime,
      priority: "LOW",
      status: "PENDING",
      isRecurring: true,
      recurrenceRule: "DAILY",
      recurrenceInterval: 1,
      missedPolicy: "NOTIFY_IMMEDIATELY",
    },
  });

  await schedulerEngine.processReminder(pastRecurring.id);
  const advancedRecurring = await prisma.reminder.findUnique({
    where: { id: pastRecurring.id },
  });
  assert(
    advancedRecurring !== null &&
      advancedRecurring.status === "PENDING" &&
      advancedRecurring.dueAt.getTime() > Date.now(),
    "5.5 Processed recurring reminder remains PENDING and advances dueAt to next occurrence"
  );

  // ===========================================================================
  // TEST GROUP 6: MISSED REMINDER OFFLINE RECOVERY
  // ===========================================================================
  console.log("\n--- TEST GROUP 6: Offline Downtime Missed Reminder Recovery ---");

  // Create a past-due reminder simulated as missed while machine was off
  const missedTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  const missedReminder = await prisma.reminder.create({
    data: {
      userId: user.id,
      title: "Missed scheduled system backup notification",
      dueAt: missedTime,
      priority: "CRITICAL",
      status: "PENDING",
      missedPolicy: "NOTIFY_IMMEDIATELY",
    },
  });

  const recoveredResult = await schedulerEngine.recoverMissedReminders();
  assert(
    recoveredResult.recoveredCount >= 1,
    "6.1 Startup recovery detects past-due unnotified reminders",
    `Recovered: ${recoveredResult.recoveredCount}`
  );

  const recoveredDbRecord = await prisma.reminder.findUnique({
    where: { id: missedReminder.id },
  });
  assert(
    recoveredDbRecord?.status === "SENT",
    "6.2 Missed reminder with NOTIFY_IMMEDIATELY policy processed to SENT"
  );

  const missedNotification = await prisma.notification.findFirst({
    where: { reminderId: missedReminder.id },
  });
  assert(
    missedNotification !== null &&
      missedNotification.title.includes("Missed scheduled system backup notification"),
    "6.3 Immediate alert notification generated for missed reminder on startup recovery"
  );

  // ===========================================================================
  // TEST GROUP 7: NOTIFICATION CENTER MANAGEMENT
  // ===========================================================================
  console.log("\n--- TEST GROUP 7: Notification Center & Activity Inbox ---");

  // 7.1 Query notifications
  const userNotifications = await notificationService.listForUser(user.id);
  assert(
    userNotifications.length >= 2,
    "7.1 List user notifications returns created alerts"
  );

  // 7.2 Unread count
  const unreadCount = await notificationService.getUnreadCount(user.id);
  assert(unreadCount >= 2, "7.2 getUnreadCount accurately computes unread items");

  // 7.3 Mark single notification read
  const firstNotif = userNotifications[0];
  await notificationService.markAsRead(firstNotif.id, user.id);
  const unreadAfterSingle = await notificationService.getUnreadCount(user.id);
  assert(
    unreadAfterSingle === unreadCount - 1,
    "7.3 Mark single notification as read decrements unread count"
  );

  // 7.4 Mark all notifications read
  await notificationService.markAllAsRead(user.id);
  const unreadAfterAll = await notificationService.getUnreadCount(user.id);
  assert(
    unreadAfterAll === 0,
    "7.4 Mark all notifications as read resets unread count to 0"
  );

  // 7.5 Delete single notification
  await notificationService.deleteNotification(firstNotif.id, user.id);
  const notifsAfterDelete = await notificationService.listForUser(user.id);
  assert(
    !notifsAfterDelete.some((n) => n.id === firstNotif.id),
    "7.5 Delete single notification removes it from list"
  );

  // ===========================================================================
  // TEST GROUP 8: USER SETTINGS & PREFERENCES
  // ===========================================================================
  console.log("\n--- TEST GROUP 8: User Settings & Scheduler Preferences ---");

  // 8.1 Upsert user settings
  const updatedSettings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {
      timezone: "Asia/Kolkata",
      soundEnabled: true,
      soundTheme: "modern",
      defaultSnoozeMinutes: 15,
      missedReminderPolicy: "NOTIFY_IMMEDIATELY",
      notificationBrowser: true,
    },
    create: {
      userId: user.id,
      timezone: "Asia/Kolkata",
      soundEnabled: true,
      soundTheme: "modern",
      defaultSnoozeMinutes: 15,
      missedReminderPolicy: "NOTIFY_IMMEDIATELY",
      notificationBrowser: true,
    },
  });

  assert(
    updatedSettings.timezone === "Asia/Kolkata" &&
      updatedSettings.soundTheme === "modern" &&
      updatedSettings.defaultSnoozeMinutes === 15 &&
      updatedSettings.soundEnabled === true,
    "8.1 User reminder settings configured with Asia/Kolkata, modern audio chime, and 15m default snooze"
  );

  // ===========================================================================
  // TEST GROUP 9: DASHBOARD & REMINDER METRICS
  // ===========================================================================
  console.log("\n--- TEST GROUP 9: Reminder Metrics & Section Aggregation ---");

  const stats = await reminderService.getReminderStats(user.id);
  assert(
    typeof stats.total === "number" &&
      typeof stats.today === "number" &&
      typeof stats.upcoming === "number" &&
      typeof stats.overdue === "number" &&
      typeof stats.recurring === "number" &&
      typeof stats.completed === "number" &&
      typeof stats.cancelled === "number" &&
      stats.total >= 3,
    "9.1 getReminderStats computes real database counts across all sections",
    `Total: ${stats.total}, Today: ${stats.today}, Upcoming: ${stats.upcoming}, Recurring: ${stats.recurring}`
  );

  // Summary
  console.log("\n================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await stopBoss();
    await prisma.$disconnect();
  });
