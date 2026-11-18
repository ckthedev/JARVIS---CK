-- DropForeignKey
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_taskId_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "reminderId" TEXT;

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "lastNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "meetingId" TEXT,
ADD COLUMN     "missedPolicy" TEXT NOT NULL DEFAULT 'NOTIFY_IMMEDIATELY',
ADD COLUMN     "nextRunAt" TIMESTAMP(3),
ADD COLUMN     "offsetMinutes" INTEGER,
ADD COLUMN     "recurrenceDayOfMonth" INTEGER,
ADD COLUMN     "recurrenceDaysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "recurrenceEndAt" TIMESTAMP(3),
ADD COLUMN     "recurrenceInterval" INTEGER DEFAULT 1,
ADD COLUMN     "recurrenceMonth" INTEGER,
ADD COLUMN     "recurrenceRule" TEXT,
ADD COLUMN     "snoozeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "snoozedUntil" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "defaultSnoozeMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "missedReminderPolicy" TEXT NOT NULL DEFAULT 'NOTIFY_IMMEDIATELY',
ADD COLUMN     "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "soundTheme" TEXT NOT NULL DEFAULT 'subtle',
ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata';

-- CreateTable
CREATE TABLE "reminder_deliveries" (
    "id" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DELIVERED',
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "error" TEXT,

    CONSTRAINT "reminder_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminder_deliveries_reminderId_idx" ON "reminder_deliveries"("reminderId");

-- CreateIndex
CREATE INDEX "reminder_deliveries_userId_deliveredAt_idx" ON "reminder_deliveries"("userId", "deliveredAt");

-- CreateIndex
CREATE INDEX "notifications_reminderId_idx" ON "notifications"("reminderId");

-- CreateIndex
CREATE INDEX "reminders_userId_status_idx" ON "reminders"("userId", "status");

-- CreateIndex
CREATE INDEX "reminders_userId_deletedAt_idx" ON "reminders"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "reminders_taskId_idx" ON "reminders"("taskId");

-- CreateIndex
CREATE INDEX "reminders_meetingId_idx" ON "reminders"("meetingId");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_deliveries" ADD CONSTRAINT "reminder_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
