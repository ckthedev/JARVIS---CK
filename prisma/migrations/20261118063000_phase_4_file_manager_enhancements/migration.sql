-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "color" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "social_media_assets" ADD COLUMN     "fileId" TEXT;

-- AlterTable
ALTER TABLE "stored_files" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "extension" TEXT,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE INDEX "folders_userId_deletedAt_idx" ON "folders"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "social_media_assets_fileId_idx" ON "social_media_assets"("fileId");

-- CreateIndex
CREATE INDEX "stored_files_userId_category_idx" ON "stored_files"("userId", "category");

-- CreateIndex
CREATE INDEX "stored_files_userId_deletedAt_idx" ON "stored_files"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "social_media_assets" ADD CONSTRAINT "social_media_assets_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
