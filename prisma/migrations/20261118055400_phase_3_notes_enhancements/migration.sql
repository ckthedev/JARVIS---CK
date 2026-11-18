-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "plainText" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "note_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_attachments" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_categories_userId_idx" ON "note_categories"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "note_categories_userId_name_key" ON "note_categories"("userId", "name");

-- CreateIndex
CREATE INDEX "note_attachments_noteId_idx" ON "note_attachments"("noteId");

-- CreateIndex
CREATE INDEX "note_attachments_fileId_idx" ON "note_attachments"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "note_attachments_noteId_fileId_key" ON "note_attachments"("noteId", "fileId");

-- CreateIndex
CREATE INDEX "notes_userId_isArchived_idx" ON "notes"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "notes_userId_deletedAt_idx" ON "notes"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "notes_userId_categoryId_idx" ON "notes"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "note_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_categories" ADD CONSTRAINT "note_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_attachments" ADD CONSTRAINT "note_attachments_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_attachments" ADD CONSTRAINT "note_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
