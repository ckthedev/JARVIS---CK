import { FileDto } from "@/modules/files/types";
import { ReminderDto } from "@/modules/reminders/types";

export type SocialPlatform =
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LINKEDIN"
  | "PINTEREST"
  | "THREADS"
  | "YOUTUBE";

export type SocialPostStatus =
  | "IDEA"
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "CANCELLED";

export type SocialPostPriority = "HIGH" | "NORMAL" | "LOW";

export type CampaignStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type SocialCalendarViewMode = "month" | "week" | "day" | "agenda";

export interface SocialPlatformConfig {
  id: SocialPlatform;
  name: string;
  color: string;
  characterLimit?: number;
  hasTitle: boolean;
  hasDescription: boolean;
}

export const SUPPORTED_PLATFORMS: Record<SocialPlatform, SocialPlatformConfig> = {
  INSTAGRAM: {
    id: "INSTAGRAM",
    name: "Instagram",
    color: "#E1306C",
    characterLimit: 2200,
    hasTitle: false,
    hasDescription: false,
  },
  FACEBOOK: {
    id: "FACEBOOK",
    name: "Facebook",
    color: "#1877F2",
    characterLimit: 63206,
    hasTitle: false,
    hasDescription: false,
  },
  LINKEDIN: {
    id: "LINKEDIN",
    name: "LinkedIn",
    color: "#0A66C2",
    characterLimit: 3000,
    hasTitle: false,
    hasDescription: false,
  },
  PINTEREST: {
    id: "PINTEREST",
    name: "Pinterest",
    color: "#E60023",
    characterLimit: 500,
    hasTitle: true,
    hasDescription: true,
  },
  THREADS: {
    id: "THREADS",
    name: "Threads",
    color: "#FFFFFF",
    characterLimit: 500,
    hasTitle: false,
    hasDescription: false,
  },
  YOUTUBE: {
    id: "YOUTUBE",
    name: "YouTube",
    color: "#FF0000",
    characterLimit: 5000,
    hasTitle: true,
    hasDescription: true,
  },
};

export interface SocialPlatformVariantDto {
  id: string;
  postId: string;
  platform: SocialPlatform;
  caption: string | null;
  title: string | null;
  description: string | null;
  customData?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPostMediaDto {
  id: string;
  postId: string;
  fileId: string;
  displayOrder: number;
  caption: string | null;
  createdAt: Date;
  file?: FileDto | null;
}

export interface SocialPostHashtagDto {
  postId: string;
  hashtagId: string;
  createdAt: Date;
  hashtag?: HashtagDto | null;
}

export interface SocialPostActivityDto {
  id: string;
  postId: string;
  userId: string;
  previousStatus: string | null;
  newStatus: string | null;
  action: string;
  details: string | null;
  createdAt: Date;
  userName?: string;
}

export interface ContentPillarDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  postCount?: number;
}

export interface HashtagDto {
  id: string;
  userId: string;
  tag: string;
  displayTag: string;
  category: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;
}

export interface HashtagCollectionDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  hashtags?: HashtagDto[];
  hashtagCount?: number;
}

export interface SocialCampaignDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  objective: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: CampaignStatus;
  platforms: string[];
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  postCount?: number;
  statusDistribution?: Record<string, number>;
}

export interface SocialPostDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  content: string; // backward compatibility fallback
  internalNotes: string | null;
  status: SocialPostStatus;
  priority: SocialPostPriority;
  plannedAt: Date | null;
  scheduledFor?: Date | null; // backward compatibility
  publishedAt: Date | null;
  reviewedAt: Date | null;
  approvedAt: Date | null;
  timezone: string;
  campaignId: string | null;
  contentPillarId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Hydrated associations
  campaign?: SocialCampaignDto | null;
  contentPillar?: ContentPillarDto | null;
  platforms?: SocialPlatformVariantDto[];
  media?: SocialPostMediaDto[];
  hashtags?: SocialPostHashtagDto[];
  activities?: SocialPostActivityDto[];
  reminders?: ReminderDto[];

  // Quick summary counts
  mediaCount?: number;
  platformCount?: number;
  hashtagCount?: number;

  // Backward compatibility fields
  accountName?: string | null;
  platform?: string | null;
}

export interface SocialAccountDto {
  id: string;
  platform: string;
  accountName: string;
  handle: string;
  status: string;
}

export interface SocialFilters {
  status?: SocialPostStatus | "OVERDUE" | "ALL";
  platform?: SocialPlatform;
  campaignId?: string;
  contentPillarId?: string;
  priority?: SocialPostPriority;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "plannedAt" | "createdAt" | "updatedAt" | "title" | "priority";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
}

export interface SocialStats {
  total: number;
  ideas: number;
  drafts: number;
  inReview: number;
  approved: number;
  scheduled: number;
  published: number;
  cancelled: number;
  overdue: number;
  upcoming: number;
  byPlatform: Record<SocialPlatform, number>;
  byStatus: Record<SocialPostStatus, number>;
  activeCampaignsCount: number;
  totalPillarsCount: number;
  totalHashtagsCount: number;
}
