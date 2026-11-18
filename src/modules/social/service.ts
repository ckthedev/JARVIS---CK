import { prisma } from "@/lib/prisma/client";
import {
  Prisma,
  SocialPost,
  SocialCampaign,
  ContentPillar,
  Hashtag,
  SocialPostPlatform,
  SocialPostMedia,
  SocialPostHashtag,
  SocialPostActivity,
  StoredFile,
  Reminder,
} from "@prisma/client";
import {
  SocialPlatform,
  SocialPostStatus,
  SocialPostPriority,
  CampaignStatus,
  SocialPostDto,
  SocialCampaignDto,
  ContentPillarDto,
  HashtagDto,
  HashtagCollectionDto,
  SocialPostMediaDto,
  SocialFilters,
  SocialStats,
  SocialAccountDto,
} from "./types";
import {
  CreateSocialPostInput,
  UpdateSocialPostInput,
  CreateCampaignInput,
  UpdateCampaignInput,
  CreatePillarInput,
  UpdatePillarInput,
  CreateHashtagInput,
  UpdateHashtagInput,
  CreateHashtagCollectionInput,
  UpdateHashtagCollectionInput,
} from "@/lib/validations/social";
import { FileDto, FileCategory } from "@/modules/files/types";
import { ReminderDto, ReminderStatus, ReminderPriority } from "@/modules/reminders/types";
import { reminderService } from "@/modules/reminders/service";

export class SocialService {
  // ===========================================================================
  // SOCIAL POSTS CRUD & WORKFLOW
  // ===========================================================================

  async getPosts(userId: string, filters: SocialFilters = {}): Promise<SocialPostDto[]> {
    const {
      status,
      platform,
      campaignId,
      contentPillarId,
      priority,
      search,
      startDate,
      endDate,
      sortBy = "plannedAt",
      sortOrder = "asc",
      limit,
      page,
    } = filters;

    const now = new Date();
    const where: Prisma.SocialPostWhereInput = {
      userId,
      deletedAt: null,
    };

    // Status filtering
    if (status) {
      if (status === "OVERDUE") {
        where.status = "SCHEDULED";
        where.plannedAt = { lt: now };
      } else if (status !== "ALL") {
        where.status = status;
      }
    }

    // Platform filtering
    if (platform) {
      where.platforms = {
        some: {
          platform,
        },
      };
    }

    // Campaign filtering
    if (campaignId) {
      where.campaignId = campaignId;
    }

    // Content pillar filtering
    if (contentPillarId) {
      where.contentPillarId = contentPillarId;
    }

    // Priority filtering
    if (priority) {
      where.priority = priority;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.plannedAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    // Search query
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { content: { contains: term, mode: "insensitive" } },
        {
          platforms: {
            some: {
              OR: [
                { caption: { contains: term, mode: "insensitive" } },
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          hashtags: {
            some: {
              hashtag: {
                displayTag: { contains: term, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    // Sorting
    let orderBy: Prisma.SocialPostOrderByWithRelationInput = {};
    if (sortBy === "plannedAt") {
      orderBy = { plannedAt: { sort: sortOrder, nulls: "last" } };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "updatedAt") {
      orderBy = { updatedAt: sortOrder };
    } else if (sortBy === "title") {
      orderBy = { title: sortOrder };
    } else if (sortBy === "priority") {
      orderBy = { priority: sortOrder };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const take = limit ? Math.max(1, limit) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const posts = await prisma.socialPost.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        campaign: true,
        contentPillar: true,
        platforms: true,
        media: {
          orderBy: { displayOrder: "asc" },
          include: { file: true },
        },
        hashtags: {
          include: { hashtag: true },
        },
        reminders: {
          where: { deletedAt: null },
        },
      },
    });

    return posts.map((p) => this.mapPostToDto(p));
  }

  async getPostById(userId: string, id: string): Promise<SocialPostDto | null> {
    const post = await prisma.socialPost.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        campaign: true,
        contentPillar: true,
        platforms: true,
        media: {
          orderBy: { displayOrder: "asc" },
          include: { file: true },
        },
        hashtags: {
          include: { hashtag: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true } },
          },
        },
        reminders: {
          where: { deletedAt: null },
        },
      },
    });

    if (!post) return null;
    return this.mapPostToDto(post);
  }

  async createPost(userId: string, input: CreateSocialPostInput): Promise<SocialPostDto> {
    const plannedAtDate = input.plannedAt ? new Date(input.plannedAt) : null;

    // Verify campaign belongs to user if specified
    if (input.campaignId) {
      const camp = await prisma.socialCampaign.findFirst({
        where: { id: input.campaignId, userId },
      });
      if (!camp) throw new Error("Invalid campaign ID");
    }

    // Verify pillar belongs to user if specified
    if (input.contentPillarId) {
      const pillar = await prisma.contentPillar.findFirst({
        where: { id: input.contentPillarId, userId },
      });
      if (!pillar) throw new Error("Invalid content pillar ID");
    }

    // Determine initial content string from primary platform or description
    const defaultContent =
      input.platforms && input.platforms.length > 0
        ? input.platforms[0].caption || ""
        : input.description || "";

    const post = await prisma.socialPost.create({
      data: {
        userId,
        title: input.title,
        description: input.description || null,
        content: defaultContent,
        internalNotes: input.internalNotes || null,
        status: input.status || "DRAFT",
        priority: input.priority || "NORMAL",
        plannedAt: plannedAtDate,
        scheduledFor: plannedAtDate,
        timezone: input.timezone || "Asia/Kolkata",
        campaignId: input.campaignId || null,
        contentPillarId: input.contentPillarId || null,
        platforms:
          input.platforms && input.platforms.length > 0
            ? {
                create: input.platforms.map((p) => ({
                  platform: p.platform,
                  caption: p.caption || null,
                  title: p.title || null,
                  description: p.description || null,
                  customData: (p.customData as Prisma.InputJsonValue) || Prisma.JsonNull,
                })),
              }
            : undefined,
      },
    });

    // Handle media attachments
    if (input.media && input.media.length > 0) {
      for (const m of input.media) {
        const file = await prisma.storedFile.findFirst({
          where: { id: m.fileId, userId, deletedAt: null },
        });
        if (file) {
          await prisma.socialPostMedia.create({
            data: {
              postId: post.id,
              fileId: file.id,
              displayOrder: m.displayOrder || 0,
              caption: m.caption || null,
            },
          }).catch(() => {});
        }
      }
    }

    // Handle hashtags
    if (input.hashtagIds && input.hashtagIds.length > 0) {
      for (const hId of input.hashtagIds) {
        const ht = await prisma.hashtag.findFirst({
          where: { id: hId, userId },
        });
        if (ht) {
          await prisma.socialPostHashtag.create({
            data: {
              postId: post.id,
              hashtagId: ht.id,
            },
          }).catch(() => {});
        }
      }
    }

    // Handle reminders if plannedAt is set
    if (plannedAtDate && input.reminderOffsets && input.reminderOffsets.length > 0) {
      await this.syncPostReminders(userId, post.id, post.title, plannedAtDate, input.reminderOffsets);
    }

    // Log Activity
    await prisma.socialPostActivity.create({
      data: {
        postId: post.id,
        userId,
        action: "CREATED",
        newStatus: post.status,
        details: `Created content item with initial status ${post.status}`,
      },
    });

    const created = await this.getPostById(userId, post.id);
    return created!;
  }

  async updatePost(userId: string, id: string, input: UpdateSocialPostInput): Promise<SocialPostDto> {
    const existing = await prisma.socialPost.findFirst({
      where: { id, userId, deletedAt: null },
      include: { platforms: true },
    });
    if (!existing) throw new Error("Post not found");

    const plannedAtDate =
      input.plannedAt !== undefined
        ? input.plannedAt
          ? new Date(input.plannedAt)
          : null
        : existing.plannedAt;

    const isPlannedAtChanged =
      (existing.plannedAt?.getTime() ?? 0) !== (plannedAtDate?.getTime() ?? 0);

    // Update base record
    await prisma.socialPost.update({
      where: { id },
      data: {
        title: input.title !== undefined ? input.title : existing.title,
        description: input.description !== undefined ? input.description : existing.description,
        internalNotes: input.internalNotes !== undefined ? input.internalNotes : existing.internalNotes,
        status: input.status !== undefined ? input.status : existing.status,
        priority: input.priority !== undefined ? input.priority : existing.priority,
        plannedAt: plannedAtDate,
        scheduledFor: plannedAtDate,
        timezone: input.timezone !== undefined ? input.timezone : existing.timezone,
        campaignId: input.campaignId !== undefined ? input.campaignId : existing.campaignId,
        contentPillarId: input.contentPillarId !== undefined ? input.contentPillarId : existing.contentPillarId,
      },
    });

    // Update platforms if provided
    if (input.platforms !== undefined) {
      await prisma.socialPostPlatform.deleteMany({ where: { postId: id } });
      if (input.platforms.length > 0) {
        await prisma.socialPostPlatform.createMany({
          data: input.platforms.map((p) => ({
            postId: id,
            platform: p.platform,
            caption: p.caption || null,
            title: p.title || null,
            description: p.description || null,
            customData: (p.customData as Prisma.InputJsonValue) || Prisma.JsonNull,
          })),
        });
      }
    }

    // Update media if provided
    if (input.media !== undefined) {
      await prisma.socialPostMedia.deleteMany({ where: { postId: id } });
      for (const m of input.media) {
        const file = await prisma.storedFile.findFirst({
          where: { id: m.fileId, userId, deletedAt: null },
        });
        if (file) {
          await prisma.socialPostMedia.create({
            data: {
              postId: id,
              fileId: file.id,
              displayOrder: m.displayOrder || 0,
              caption: m.caption || null,
            },
          }).catch(() => {});
        }
      }
    }

    // Update hashtags if provided
    if (input.hashtagIds !== undefined) {
      await prisma.socialPostHashtag.deleteMany({ where: { postId: id } });
      for (const hId of input.hashtagIds) {
        const ht = await prisma.hashtag.findFirst({
          where: { id: hId, userId },
        });
        if (ht) {
          await prisma.socialPostHashtag.create({
            data: {
              postId: id,
              hashtagId: ht.id,
            },
          }).catch(() => {});
        }
      }
    }

    // If planned date shifted or offsets provided, adjust reminders
    if (plannedAtDate && (isPlannedAtChanged || input.reminderOffsets !== undefined)) {
      const offsets =
        input.reminderOffsets !== undefined
          ? input.reminderOffsets
          : [15];
      await this.syncPostReminders(
        userId,
        id,
        input.title || existing.title,
        plannedAtDate,
        offsets
      );
    }

    // Log Activity
    await prisma.socialPostActivity.create({
      data: {
        postId: id,
        userId,
        action: "UPDATED",
        previousStatus: existing.status,
        newStatus: input.status || existing.status,
        details: "Updated content post metadata / platform variants",
      },
    });

    const updated = await this.getPostById(userId, id);
    return updated!;
  }

  async transitionPostStatus(
    userId: string,
    id: string,
    newStatus: SocialPostStatus,
    notes?: string
  ): Promise<SocialPostDto> {
    const post = await prisma.socialPost.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!post) throw new Error("Post not found");

    const previousStatus = post.status as SocialPostStatus;
    const now = new Date();

    const dataToUpdate: Prisma.SocialPostUpdateInput = {
      status: newStatus,
    };

    if (newStatus === "PUBLISHED") {
      dataToUpdate.publishedAt = now;
      // Cancel remaining pending reminders
      await this.cancelPostReminders(id);
    } else if (newStatus === "APPROVED") {
      dataToUpdate.approvedAt = now;
    } else if (newStatus === "IN_REVIEW") {
      dataToUpdate.reviewedAt = now;
    } else if (newStatus === "CANCELLED") {
      await this.cancelPostReminders(id);
    } else if (newStatus === "DRAFT") {
      // Moving back to draft
      dataToUpdate.publishedAt = null;
    }

    await prisma.socialPost.update({
      where: { id },
      data: dataToUpdate,
    });

    await prisma.socialPostActivity.create({
      data: {
        postId: id,
        userId,
        action: "STATUS_CHANGED",
        previousStatus,
        newStatus,
        details: notes || `Status changed from ${previousStatus} to ${newStatus}`,
      },
    });

    const updated = await this.getPostById(userId, id);
    return updated!;
  }

  async duplicatePost(userId: string, id: string): Promise<SocialPostDto> {
    const existing = await this.getPostById(userId, id);
    if (!existing) throw new Error("Post not found");

    const duplicated = await this.createPost(userId, {
      title: `Copy of ${existing.title}`,
      description: existing.description,
      internalNotes: existing.internalNotes,
      status: "DRAFT",
      priority: existing.priority,
      plannedAt: null,
      timezone: existing.timezone,
      campaignId: existing.campaignId,
      contentPillarId: existing.contentPillarId,
      platforms: existing.platforms?.map((p) => ({
        platform: p.platform,
        caption: p.caption,
        title: p.title,
        description: p.description,
      })) || [],
      media: existing.media?.map((m) => ({
        fileId: m.fileId,
        displayOrder: m.displayOrder,
        caption: m.caption,
      })) || [],
      hashtagIds: existing.hashtags?.map((h) => h.hashtagId) || [],
    });

    await prisma.socialPostActivity.create({
      data: {
        postId: duplicated.id,
        userId,
        action: "DUPLICATED",
        details: `Duplicated from original post "${existing.title}"`,
      },
    });

    return duplicated;
  }

  async deletePost(userId: string, id: string, permanent = false): Promise<void> {
    const post = await prisma.socialPost.findFirst({
      where: { id, userId },
    });
    if (!post) throw new Error("Post not found");

    await this.cancelPostReminders(id);

    if (permanent) {
      await prisma.socialPost.delete({
        where: { id },
      });
    } else {
      await prisma.socialPost.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });
    }
  }

  async reschedulePost(userId: string, id: string, newPlannedAt: Date | string): Promise<SocialPostDto> {
    const post = await prisma.socialPost.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!post) throw new Error("Post not found");

    const date = new Date(newPlannedAt);

    await prisma.socialPost.update({
      where: { id },
      data: {
        plannedAt: date,
        scheduledFor: date,
        status: "SCHEDULED",
      },
    });

    // Update reminders
    await this.syncPostReminders(userId, id, post.title, date, [15]);

    await prisma.socialPostActivity.create({
      data: {
        postId: id,
        userId,
        action: "RESCHEDULED",
        previousStatus: post.status,
        newStatus: "SCHEDULED",
        details: `Rescheduled planned publishing time to ${date.toISOString()}`,
      },
    });

    const updated = await this.getPostById(userId, id);
    return updated!;
  }

  // ===========================================================================
  // MEDIA ATTACHMENTS
  // ===========================================================================

  async attachMedia(
    userId: string,
    postId: string,
    fileId: string,
    displayOrder = 0,
    caption?: string
  ): Promise<SocialPostMediaDto> {
    const post = await prisma.socialPost.findFirst({
      where: { id: postId, userId, deletedAt: null },
    });
    if (!post) throw new Error("Post not found");

    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, userId, deletedAt: null },
    });
    if (!file) throw new Error("File not found or does not belong to user");

    const media = await prisma.socialPostMedia.upsert({
      where: {
        postId_fileId: { postId, fileId },
      },
      create: {
        postId,
        fileId,
        displayOrder,
        caption: caption || null,
      },
      update: {
        displayOrder,
        caption: caption !== undefined ? caption : undefined,
      },
      include: { file: true },
    });

    await prisma.socialPostActivity.create({
      data: {
        postId,
        userId,
        action: "MEDIA_ATTACHED",
        details: `Attached media file "${file.originalName}"`,
      },
    });

    return {
      id: media.id,
      postId: media.postId,
      fileId: media.fileId,
      displayOrder: media.displayOrder,
      caption: media.caption,
      createdAt: media.createdAt,
      file: this.mapStoredFileToDto(media.file),
    };
  }

  async detachMedia(userId: string, postId: string, fileId: string): Promise<void> {
    const post = await prisma.socialPost.findFirst({
      where: { id: postId, userId, deletedAt: null },
    });
    if (!post) throw new Error("Post not found");

    await prisma.socialPostMedia.deleteMany({
      where: { postId, fileId },
    });
  }

  // ===========================================================================
  // CAMPAIGNS
  // ===========================================================================

  async getCampaigns(userId: string, status?: CampaignStatus): Promise<SocialCampaignDto[]> {
    const where: Prisma.SocialCampaignWhereInput = { userId };
    if (status) where.status = status;

    const campaigns = await prisma.socialCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        posts: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
    });

    return campaigns.map((c) => {
      const dist: Record<string, number> = {};
      for (const p of c.posts) {
        dist[p.status] = (dist[p.status] || 0) + 1;
      }
      return {
        id: c.id,
        userId: c.userId,
        name: c.name,
        description: c.description,
        objective: c.objective,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status as CampaignStatus,
        platforms: c.platforms,
        internalNotes: c.internalNotes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        postCount: c.posts.length,
        statusDistribution: dist,
      };
    });
  }

  async getCampaignById(userId: string, id: string): Promise<SocialCampaignDto | null> {
    const campaign = await prisma.socialCampaign.findFirst({
      where: { id, userId },
      include: {
        posts: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
    });
    if (!campaign) return null;

    const dist: Record<string, number> = {};
    for (const p of campaign.posts) {
      dist[p.status] = (dist[p.status] || 0) + 1;
    }

    return {
      id: campaign.id,
      userId: campaign.userId,
      name: campaign.name,
      description: campaign.description,
      objective: campaign.objective,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status as CampaignStatus,
      platforms: campaign.platforms,
      internalNotes: campaign.internalNotes,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      postCount: campaign.posts.length,
      statusDistribution: dist,
    };
  }

  async createCampaign(userId: string, input: CreateCampaignInput): Promise<SocialCampaignDto> {
    const campaign = await prisma.socialCampaign.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        objective: input.objective || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: input.status || "PLANNING",
        platforms: input.platforms || [],
        internalNotes: input.internalNotes || null,
      },
    });

    return {
      id: campaign.id,
      userId: campaign.userId,
      name: campaign.name,
      description: campaign.description,
      objective: campaign.objective,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status as CampaignStatus,
      platforms: campaign.platforms,
      internalNotes: campaign.internalNotes,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      postCount: 0,
      statusDistribution: {},
    };
  }

  async updateCampaign(userId: string, id: string, input: UpdateCampaignInput): Promise<SocialCampaignDto> {
    const existing = await prisma.socialCampaign.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Campaign not found");

    const campaign = await prisma.socialCampaign.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        objective: input.objective !== undefined ? input.objective : existing.objective,
        startDate: input.startDate !== undefined ? (input.startDate ? new Date(input.startDate) : null) : existing.startDate,
        endDate: input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : existing.endDate,
        status: input.status !== undefined ? input.status : existing.status,
        platforms: input.platforms !== undefined ? input.platforms : existing.platforms,
        internalNotes: input.internalNotes !== undefined ? input.internalNotes : existing.internalNotes,
      },
      include: {
        posts: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
    });

    const dist: Record<string, number> = {};
    for (const p of campaign.posts) {
      dist[p.status] = (dist[p.status] || 0) + 1;
    }

    return {
      id: campaign.id,
      userId: campaign.userId,
      name: campaign.name,
      description: campaign.description,
      objective: campaign.objective,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status as CampaignStatus,
      platforms: campaign.platforms,
      internalNotes: campaign.internalNotes,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      postCount: campaign.posts.length,
      statusDistribution: dist,
    };
  }

  async deleteCampaign(userId: string, id: string): Promise<void> {
    const campaign = await prisma.socialCampaign.findFirst({ where: { id, userId } });
    if (!campaign) throw new Error("Campaign not found");

    // Re-parent / unassign posts safely
    await prisma.socialPost.updateMany({
      where: { campaignId: id },
      data: { campaignId: null },
    });

    await prisma.socialCampaign.delete({ where: { id } });
  }

  // ===========================================================================
  // CONTENT PILLARS
  // ===========================================================================

  async getPillars(userId: string, includeArchived = false): Promise<ContentPillarDto[]> {
    const where: Prisma.ContentPillarWhereInput = {
      userId,
      ...(includeArchived ? {} : { isArchived: false }),
    };

    const pillars = await prisma.contentPillar.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { posts: { where: { deletedAt: null } } },
        },
      },
    });

    return pillars.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.name,
      description: p.description,
      color: p.color,
      isArchived: p.isArchived,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      postCount: p._count.posts,
    }));
  }

  async createPillar(userId: string, input: CreatePillarInput): Promise<ContentPillarDto> {
    const pillar = await prisma.contentPillar.upsert({
      where: {
        userId_name: { userId, name: input.name },
      },
      create: {
        userId,
        name: input.name,
        description: input.description || null,
        color: input.color || "#00D4FF",
      },
      update: {
        description: input.description !== undefined ? input.description : undefined,
        color: input.color !== undefined ? input.color : undefined,
        isArchived: false,
      },
    });

    return {
      id: pillar.id,
      userId: pillar.userId,
      name: pillar.name,
      description: pillar.description,
      color: pillar.color,
      isArchived: pillar.isArchived,
      createdAt: pillar.createdAt,
      updatedAt: pillar.updatedAt,
      postCount: 0,
    };
  }

  async updatePillar(userId: string, id: string, input: UpdatePillarInput): Promise<ContentPillarDto> {
    const existing = await prisma.contentPillar.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Content pillar not found");

    const pillar = await prisma.contentPillar.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        color: input.color !== undefined ? input.color : existing.color,
      },
      include: {
        _count: {
          select: { posts: { where: { deletedAt: null } } },
        },
      },
    });

    return {
      id: pillar.id,
      userId: pillar.userId,
      name: pillar.name,
      description: pillar.description,
      color: pillar.color,
      isArchived: pillar.isArchived,
      createdAt: pillar.createdAt,
      updatedAt: pillar.updatedAt,
      postCount: pillar._count.posts,
    };
  }

  async deletePillar(userId: string, id: string): Promise<void> {
    const pillar = await prisma.contentPillar.findFirst({ where: { id, userId } });
    if (!pillar) throw new Error("Content pillar not found");

    // Unassign posts safely
    await prisma.socialPost.updateMany({
      where: { contentPillarId: id },
      data: { contentPillarId: null },
    });

    await prisma.contentPillar.delete({ where: { id } });
  }

  // ===========================================================================
  // HASHTAGS & COLLECTIONS
  // ===========================================================================

  async getHashtags(userId: string, search?: string, category?: string): Promise<HashtagDto[]> {
    const where: Prisma.HashtagWhereInput = { userId };
    if (search && search.trim()) {
      const term = search.trim().toLowerCase().replace(/^#/, "");
      where.OR = [
        { tag: { contains: term, mode: "insensitive" } },
        { displayTag: { contains: term, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const hashtags = await prisma.hashtag.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return hashtags.map((h) => ({
      id: h.id,
      userId: h.userId,
      tag: h.tag,
      displayTag: h.displayTag,
      category: h.category,
      notes: h.notes,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      usageCount: h._count.posts,
    }));
  }

  async createHashtag(userId: string, input: CreateHashtagInput): Promise<HashtagDto> {
    const cleanDisplay = input.displayTag.trim().startsWith("#")
      ? input.displayTag.trim()
      : `#${input.displayTag.trim()}`;
    const normalized = cleanDisplay.toLowerCase().replace(/^#/, "");

    const hashtag = await prisma.hashtag.upsert({
      where: {
        userId_tag: { userId, tag: normalized },
      },
      create: {
        userId,
        tag: normalized,
        displayTag: cleanDisplay,
        category: input.category || null,
        notes: input.notes || null,
      },
      update: {
        displayTag: cleanDisplay,
        category: input.category !== undefined ? input.category : undefined,
        notes: input.notes !== undefined ? input.notes : undefined,
      },
    });

    return {
      id: hashtag.id,
      userId: hashtag.userId,
      tag: hashtag.tag,
      displayTag: hashtag.displayTag,
      category: hashtag.category,
      notes: hashtag.notes,
      createdAt: hashtag.createdAt,
      updatedAt: hashtag.updatedAt,
      usageCount: 0,
    };
  }

  async updateHashtag(userId: string, id: string, input: UpdateHashtagInput): Promise<HashtagDto> {
    const existing = await prisma.hashtag.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Hashtag not found");

    let cleanDisplay = existing.displayTag;
    let normalized = existing.tag;

    if (input.displayTag) {
      cleanDisplay = input.displayTag.trim().startsWith("#")
        ? input.displayTag.trim()
        : `#${input.displayTag.trim()}`;
      normalized = cleanDisplay.toLowerCase().replace(/^#/, "");
    }

    const hashtag = await prisma.hashtag.update({
      where: { id },
      data: {
        tag: normalized,
        displayTag: cleanDisplay,
        category: input.category !== undefined ? input.category : existing.category,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      },
    });

    return {
      id: hashtag.id,
      userId: hashtag.userId,
      tag: hashtag.tag,
      displayTag: hashtag.displayTag,
      category: hashtag.category,
      notes: hashtag.notes,
      createdAt: hashtag.createdAt,
      updatedAt: hashtag.updatedAt,
    };
  }

  async deleteHashtag(userId: string, id: string): Promise<void> {
    const existing = await prisma.hashtag.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Hashtag not found");

    await prisma.hashtag.delete({ where: { id } });
  }

  async getHashtagCollections(userId: string): Promise<HashtagCollectionDto[]> {
    const collections = await prisma.hashtagCollection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        hashtags: {
          include: { hashtag: true },
        },
      },
    });

    return collections.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      description: c.description,
      color: c.color,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      hashtags: c.hashtags.map((h) => ({
        id: h.hashtag.id,
        userId: h.hashtag.userId,
        tag: h.hashtag.tag,
        displayTag: h.hashtag.displayTag,
        category: h.hashtag.category,
        notes: h.hashtag.notes,
        createdAt: h.hashtag.createdAt,
        updatedAt: h.hashtag.updatedAt,
      })),
      hashtagCount: c.hashtags.length,
    }));
  }

  async createHashtagCollection(
    userId: string,
    input: CreateHashtagCollectionInput
  ): Promise<HashtagCollectionDto> {
    const collection = await prisma.hashtagCollection.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        color: input.color || "#7A3FFF",
        hashtags:
          input.hashtagIds && input.hashtagIds.length > 0
            ? {
                create: input.hashtagIds.map((hId) => ({
                  hashtagId: hId,
                })),
              }
            : undefined,
      },
      include: {
        hashtags: {
          include: { hashtag: true },
        },
      },
    });

    return {
      id: collection.id,
      userId: collection.userId,
      name: collection.name,
      description: collection.description,
      color: collection.color,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      hashtags: collection.hashtags.map((h) => ({
        id: h.hashtag.id,
        userId: h.hashtag.userId,
        tag: h.hashtag.tag,
        displayTag: h.hashtag.displayTag,
        category: h.hashtag.category,
        notes: h.hashtag.notes,
        createdAt: h.hashtag.createdAt,
        updatedAt: h.hashtag.updatedAt,
      })),
      hashtagCount: collection.hashtags.length,
    };
  }

  async updateHashtagCollection(
    userId: string,
    id: string,
    input: UpdateHashtagCollectionInput
  ): Promise<HashtagCollectionDto> {
    const existing = await prisma.hashtagCollection.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Hashtag collection not found");

    if (input.hashtagIds !== undefined) {
      await prisma.hashtagInCollection.deleteMany({ where: { collectionId: id } });
      if (input.hashtagIds.length > 0) {
        await prisma.hashtagInCollection.createMany({
          data: input.hashtagIds.map((hId) => ({
            collectionId: id,
            hashtagId: hId,
          })),
        });
      }
    }

    const collection = await prisma.hashtagCollection.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        color: input.color !== undefined ? input.color : existing.color,
      },
      include: {
        hashtags: {
          include: { hashtag: true },
        },
      },
    });

    return {
      id: collection.id,
      userId: collection.userId,
      name: collection.name,
      description: collection.description,
      color: collection.color,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      hashtags: collection.hashtags.map((h) => ({
        id: h.hashtag.id,
        userId: h.hashtag.userId,
        tag: h.hashtag.tag,
        displayTag: h.hashtag.displayTag,
        category: h.hashtag.category,
        notes: h.hashtag.notes,
        createdAt: h.hashtag.createdAt,
        updatedAt: h.hashtag.updatedAt,
      })),
      hashtagCount: collection.hashtags.length,
    };
  }

  async deleteHashtagCollection(userId: string, id: string): Promise<void> {
    const existing = await prisma.hashtagCollection.findFirst({ where: { id, userId } });
    if (!existing) throw new Error("Hashtag collection not found");

    await prisma.hashtagCollection.delete({ where: { id } });
  }

  // ===========================================================================
  // STATS & CALENDAR
  // ===========================================================================

  async getSocialStats(userId: string): Promise<SocialStats> {
    const now = new Date();

    const [
      total,
      ideas,
      drafts,
      inReview,
      approved,
      scheduled,
      published,
      cancelled,
      overdue,
      upcoming,
      platformGroups,
      activeCampaignsCount,
      totalPillarsCount,
      totalHashtagsCount,
    ] = await Promise.all([
      prisma.socialPost.count({ where: { userId, deletedAt: null } }),
      prisma.socialPost.count({ where: { userId, deletedAt: null, status: "IDEA" } }),
      prisma.socialPost.count({ where: { userId, deletedAt: null, status: "DRAFT" } }),
      prisma.socialPost.count({ where: { userId, deletedAt: null, status: "IN_REVIEW" } }),
      prisma.socialPost.count({ where: { userId, deletedAt: null, status: "APPROVED" } }),
      prisma.socialPost.count({ where: { userId, deletedAt: null, status: "SCHEDULED" } }),
      prisma.socialPost.count({ where: { userId, deletedAt: null, status: "PUBLISHED" } }),
      prisma.socialPost.count({ where: { userId, deletedAt: null, status: "CANCELLED" } }),
      prisma.socialPost.count({
        where: {
          userId,
          deletedAt: null,
          status: "SCHEDULED",
          plannedAt: { lt: now },
        },
      }),
      prisma.socialPost.count({
        where: {
          userId,
          deletedAt: null,
          status: "SCHEDULED",
          plannedAt: { gte: now },
        },
      }),
      prisma.socialPostPlatform.groupBy({
        by: ["platform"],
        where: { post: { userId, deletedAt: null } },
        _count: { postId: true },
      }),
      prisma.socialCampaign.count({ where: { userId, status: "ACTIVE" } }),
      prisma.contentPillar.count({ where: { userId, isArchived: false } }),
      prisma.hashtag.count({ where: { userId } }),
    ]);

    const byPlatform: Record<SocialPlatform, number> = {
      INSTAGRAM: 0,
      FACEBOOK: 0,
      LINKEDIN: 0,
      PINTEREST: 0,
      THREADS: 0,
      YOUTUBE: 0,
    };

    for (const g of platformGroups) {
      if (g.platform in byPlatform) {
        byPlatform[g.platform as SocialPlatform] = g._count.postId;
      }
    }

    const byStatus: Record<SocialPostStatus, number> = {
      IDEA: ideas,
      DRAFT: drafts,
      IN_REVIEW: inReview,
      APPROVED: approved,
      SCHEDULED: scheduled,
      PUBLISHED: published,
      CANCELLED: cancelled,
    };

    return {
      total,
      ideas,
      drafts,
      inReview,
      approved,
      scheduled,
      published,
      cancelled,
      overdue,
      upcoming,
      byPlatform,
      byStatus,
      activeCampaignsCount,
      totalPillarsCount,
      totalHashtagsCount,
    };
  }

  async getCalendarPosts(
    userId: string,
    startDate: Date | string,
    endDate: Date | string,
    platform?: SocialPlatform,
    campaignId?: string,
    status?: SocialPostStatus
  ): Promise<SocialPostDto[]> {
    return this.getPosts(userId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      platform,
      campaignId,
      status,
      sortBy: "plannedAt",
      sortOrder: "asc",
    });
  }

  // ===========================================================================
  // REMINDER HELPER
  // ===========================================================================

  private async syncPostReminders(
    userId: string,
    postId: string,
    postTitle: string,
    plannedAt: Date,
    offsets: number[]
  ): Promise<void> {
    // Cancel existing reminders for this post first
    await this.cancelPostReminders(postId);

    for (const offset of offsets) {
      const dueAt = new Date(plannedAt.getTime() - offset * 60 * 1000);
      await reminderService.createReminder(userId, {
        title: `Social Post: ${postTitle}`,
        description: `Scheduled to publish on ${plannedAt.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}`,
        dueAt,
        priority: "NORMAL",
        offsetMinutes: offset,
      }).then(async (rem) => {
        // Link socialPostId to reminder
        await prisma.reminder.update({
          where: { id: rem.id },
          data: { socialPostId: postId },
        });
      }).catch((err) => {
        console.warn("[SocialService] Failed to create post reminder:", err);
      });
    }
  }

  private async cancelPostReminders(postId: string): Promise<void> {
    const reminders = await prisma.reminder.findMany({
      where: { socialPostId: postId, deletedAt: null, status: { in: ["PENDING", "SNOOZED"] } },
    });
    for (const r of reminders) {
      await prisma.reminder.update({
        where: { id: r.id },
        data: { status: "CANCELLED", isCompleted: true },
      });
    }
  }

  // ===========================================================================
  // BACKWARD COMPATIBILITY
  // ===========================================================================

  async getScheduledPosts(userId: string, limit = 5): Promise<SocialPostDto[]> {
    return this.getPosts(userId, {
      status: "SCHEDULED",
      sortBy: "plannedAt",
      sortOrder: "asc",
      limit,
    });
  }

  async getConnectedAccounts(userId: string): Promise<SocialAccountDto[]> {
    return await prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        accountName: true,
        handle: true,
        status: true,
      },
    });
  }

  // ===========================================================================
  // PRIVATE MAPPERS
  // ===========================================================================

  private mapPostToDto(
    p: SocialPost & {
      campaign?: SocialCampaign | null;
      contentPillar?: ContentPillar | null;
      platforms?: SocialPostPlatform[];
      media?: (SocialPostMedia & { file?: StoredFile | null })[];
      hashtags?: (SocialPostHashtag & { hashtag?: Hashtag | null })[];
      activities?: (SocialPostActivity & { user?: { name: string } })[];
      reminders?: Reminder[];
      socialAccount?: { accountName: string; platform: string } | null;
    }
  ): SocialPostDto {
    return {
      id: p.id,
      userId: p.userId,
      title: p.title,
      description: p.description,
      content: p.content,
      internalNotes: p.internalNotes,
      status: p.status as SocialPostStatus,
      priority: p.priority as SocialPostPriority,
      plannedAt: p.plannedAt,
      scheduledFor: p.scheduledFor || p.plannedAt,
      publishedAt: p.publishedAt,
      reviewedAt: p.reviewedAt,
      approvedAt: p.approvedAt,
      timezone: p.timezone,
      campaignId: p.campaignId,
      contentPillarId: p.contentPillarId,
      deletedAt: p.deletedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      campaign: p.campaign
        ? {
            id: p.campaign.id,
            userId: p.campaign.userId,
            name: p.campaign.name,
            description: p.campaign.description,
            objective: p.campaign.objective,
            startDate: p.campaign.startDate,
            endDate: p.campaign.endDate,
            status: p.campaign.status as CampaignStatus,
            platforms: p.campaign.platforms,
            internalNotes: p.campaign.internalNotes,
            createdAt: p.campaign.createdAt,
            updatedAt: p.campaign.updatedAt,
          }
        : null,
      contentPillar: p.contentPillar
        ? {
            id: p.contentPillar.id,
            userId: p.contentPillar.userId,
            name: p.contentPillar.name,
            description: p.contentPillar.description,
            color: p.contentPillar.color,
            isArchived: p.contentPillar.isArchived,
            createdAt: p.contentPillar.createdAt,
            updatedAt: p.contentPillar.updatedAt,
          }
        : null,
      platforms: p.platforms
        ? p.platforms.map((pl) => ({
            id: pl.id,
            postId: pl.postId,
            platform: pl.platform as SocialPlatform,
            caption: pl.caption,
            title: pl.title,
            description: pl.description,
            customData: pl.customData as Record<string, unknown> | null,
            createdAt: pl.createdAt,
            updatedAt: pl.updatedAt,
          }))
        : [],
      media: p.media
        ? p.media.map((m) => ({
            id: m.id,
            postId: m.postId,
            fileId: m.fileId,
            displayOrder: m.displayOrder,
            caption: m.caption,
            createdAt: m.createdAt,
            file: m.file ? this.mapStoredFileToDto(m.file) : null,
          }))
        : [],
      hashtags: p.hashtags
        ? p.hashtags.map((h) => ({
            postId: h.postId,
            hashtagId: h.hashtagId,
            createdAt: h.createdAt,
            hashtag: h.hashtag
              ? {
                  id: h.hashtag.id,
                  userId: h.hashtag.userId,
                  tag: h.hashtag.tag,
                  displayTag: h.hashtag.displayTag,
                  category: h.hashtag.category,
                  notes: h.hashtag.notes,
                  createdAt: h.hashtag.createdAt,
                  updatedAt: h.hashtag.updatedAt,
                }
              : null,
          }))
        : [],
      activities: p.activities
        ? p.activities.map((a) => ({
            id: a.id,
            postId: a.postId,
            userId: a.userId,
            previousStatus: a.previousStatus,
            newStatus: a.newStatus,
            action: a.action,
            details: a.details,
            createdAt: a.createdAt,
            userName: a.user?.name,
          }))
        : [],
      reminders: p.reminders
        ? p.reminders.map((r) => ({
            id: r.id,
            userId: r.userId,
            taskId: r.taskId,
            meetingId: r.meetingId,
            title: r.title,
            description: r.description,
            dueAt: r.dueAt,
            isCompleted: r.isCompleted,
            status: r.status as ReminderStatus,
            priority: r.priority as ReminderPriority,
            isRecurring: r.isRecurring,
            recurrenceRule: (r.recurrenceRule as ReminderDto["recurrenceRule"]) || null,
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
          }))
        : [],
      mediaCount: p.media?.length || 0,
      platformCount: p.platforms?.length || 0,
      hashtagCount: p.hashtags?.length || 0,
      accountName: p.socialAccount?.accountName ?? null,
      platform: p.socialAccount?.platform ?? null,
    };
  }

  private mapStoredFileToDto(f: StoredFile): FileDto {
    return {
      id: f.id,
      userId: f.userId,
      folderId: f.folderId,
      originalName: f.originalName,
      storageName: f.storageName,
      mimeType: f.mimeType,
      sizeBytes: Number(f.sizeBytes),
      extension: f.extension,
      category: f.category as FileCategory,
      checksum: f.checksum,
      metadata: f.metadata as Record<string, unknown> | null,
      deletedAt: f.deletedAt,
      lastAccessedAt: f.lastAccessedAt,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      isPreviewable: Boolean(
        f.mimeType.startsWith("image/") || f.mimeType.startsWith("video/") || f.mimeType === "application/pdf"
      ),
    };
  }
}

export const socialService = new SocialService();
