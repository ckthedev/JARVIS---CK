/*
  Warnings:

  - Added the required column `updatedAt` to the `meeting_attendees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "meeting_attendees" ADD COLUMN     "organization" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "actualEndTime" TIMESTAMP(3),
ADD COLUMN     "actualStartTime" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "meetingType" TEXT NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "meetingId" TEXT;

-- CreateTable
CREATE TABLE "meeting_agenda_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER DEFAULT 15,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_note_links" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "discussionSummary" TEXT,
    "keyDecisions" TEXT,
    "importantPoints" TEXT,
    "followUpInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_note_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_attachments" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_agenda_items_meetingId_sortOrder_idx" ON "meeting_agenda_items"("meetingId", "sortOrder");

-- CreateIndex
CREATE INDEX "meeting_note_links_meetingId_idx" ON "meeting_note_links"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_note_links_noteId_idx" ON "meeting_note_links"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_note_links_meetingId_noteId_key" ON "meeting_note_links"("meetingId", "noteId");

-- CreateIndex
CREATE INDEX "meeting_attachments_meetingId_idx" ON "meeting_attachments"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_attachments_fileId_idx" ON "meeting_attachments"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_attachments_meetingId_fileId_key" ON "meeting_attachments"("meetingId", "fileId");

-- CreateIndex
CREATE INDEX "meeting_attendees_email_idx" ON "meeting_attendees"("email");

-- CreateIndex
CREATE INDEX "meetings_userId_deletedAt_idx" ON "meetings"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "tasks_meetingId_idx" ON "tasks"("meetingId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_agenda_items" ADD CONSTRAINT "meeting_agenda_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_note_links" ADD CONSTRAINT "meeting_note_links_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_note_links" ADD CONSTRAINT "meeting_note_links_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attachments" ADD CONSTRAINT "meeting_attachments_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attachments" ADD CONSTRAINT "meeting_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
