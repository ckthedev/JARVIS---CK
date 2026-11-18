-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

-- CreateIndex
CREATE UNIQUE INDEX "task_categories_userId_name_key" ON "task_categories"("userId", "name");

-- CreateIndex
CREATE INDEX "tasks_userId_deletedAt_idx" ON "tasks"("userId", "deletedAt");
