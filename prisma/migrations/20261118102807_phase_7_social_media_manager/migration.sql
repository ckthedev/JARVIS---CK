-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "socialPostId" TEXT;

-- AlterTable
ALTER TABLE "social_posts" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "contentPillarId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "plannedAt" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Untitled Post',
ALTER COLUMN "content" SET DEFAULT '';

-- CreateTable
CREATE TABLE "social_campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pillars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#00D4FF',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pillars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "displayTag" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtag_collections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#7A3FFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hashtag_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtags_in_collections" (
    "hashtagId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtags_in_collections_pkey" PRIMARY KEY ("hashtagId","collectionId")
);

-- CreateTable
CREATE TABLE "social_post_platforms" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "caption" TEXT,
    "title" TEXT,
    "description" TEXT,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_post_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_media" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_hashtags" (
    "postId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_hashtags_pkey" PRIMARY KEY ("postId","hashtagId")
);

-- CreateTable
CREATE TABLE "social_post_activities" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_post_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_campaigns_userId_status_idx" ON "social_campaigns"("userId", "status");

-- CreateIndex
CREATE INDEX "content_pillars_userId_idx" ON "content_pillars"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "content_pillars_userId_name_key" ON "content_pillars"("userId", "name");

-- CreateIndex
CREATE INDEX "hashtags_userId_idx" ON "hashtags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "hashtags_userId_tag_key" ON "hashtags"("userId", "tag");

-- CreateIndex
CREATE INDEX "hashtag_collections_userId_idx" ON "hashtag_collections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "hashtag_collections_userId_name_key" ON "hashtag_collections"("userId", "name");

-- CreateIndex
CREATE INDEX "social_post_platforms_postId_idx" ON "social_post_platforms"("postId");

-- CreateIndex
CREATE INDEX "social_post_platforms_platform_idx" ON "social_post_platforms"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_platforms_postId_platform_key" ON "social_post_platforms"("postId", "platform");

-- CreateIndex
CREATE INDEX "social_post_media_postId_displayOrder_idx" ON "social_post_media"("postId", "displayOrder");

-- CreateIndex
CREATE INDEX "social_post_media_fileId_idx" ON "social_post_media"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_media_postId_fileId_key" ON "social_post_media"("postId", "fileId");

-- CreateIndex
CREATE INDEX "social_post_hashtags_postId_idx" ON "social_post_hashtags"("postId");

-- CreateIndex
CREATE INDEX "social_post_hashtags_hashtagId_idx" ON "social_post_hashtags"("hashtagId");

-- CreateIndex
CREATE INDEX "social_post_activities_postId_createdAt_idx" ON "social_post_activities"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "social_post_activities_userId_idx" ON "social_post_activities"("userId");

-- CreateIndex
CREATE INDEX "reminders_socialPostId_idx" ON "reminders"("socialPostId");

-- CreateIndex
CREATE INDEX "social_posts_userId_plannedAt_idx" ON "social_posts"("userId", "plannedAt");

-- CreateIndex
CREATE INDEX "social_posts_userId_campaignId_idx" ON "social_posts"("userId", "campaignId");

-- CreateIndex
CREATE INDEX "social_posts_userId_contentPillarId_idx" ON "social_posts"("userId", "contentPillarId");

-- CreateIndex
CREATE INDEX "social_posts_userId_deletedAt_idx" ON "social_posts"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_socialPostId_fkey" FOREIGN KEY ("socialPostId") REFERENCES "social_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_campaigns" ADD CONSTRAINT "social_campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_pillars" ADD CONSTRAINT "content_pillars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtags" ADD CONSTRAINT "hashtags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtag_collections" ADD CONSTRAINT "hashtag_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtags_in_collections" ADD CONSTRAINT "hashtags_in_collections_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtags_in_collections" ADD CONSTRAINT "hashtags_in_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "hashtag_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "social_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_contentPillarId_fkey" FOREIGN KEY ("contentPillarId") REFERENCES "content_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_platforms" ADD CONSTRAINT "social_post_platforms_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_media" ADD CONSTRAINT "social_post_media_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_hashtags" ADD CONSTRAINT "social_post_hashtags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_hashtags" ADD CONSTRAINT "social_post_hashtags_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_activities" ADD CONSTRAINT "social_post_activities_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_activities" ADD CONSTRAINT "social_post_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
