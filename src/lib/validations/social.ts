import { z } from "zod";

export const socialPlatformEnum = z.enum([
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "PINTEREST",
  "THREADS",
  "YOUTUBE",
]);

export const socialPostStatusEnum = z.enum([
  "IDEA",
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "CANCELLED",
]);

export const socialPostPriorityEnum = z.enum(["HIGH", "NORMAL", "LOW"]);
export const campaignStatusEnum = z.enum(["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"]);

export const platformVariantSchema = z
  .object({
    platform: socialPlatformEnum,
    caption: z.string().nullable().optional(),
    title: z.string().max(255).nullable().optional(),
    description: z.string().max(10000).nullable().optional(),
    customData: z.record(z.unknown()).optional(),
  })
  .superRefine((data, ctx) => {
    const len = data.caption ? data.caption.length : 0;
    if (data.platform === "INSTAGRAM" && len > 2200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Instagram caption exceeds 2,200 character limit.",
        path: ["caption"],
      });
    } else if (data.platform === "THREADS" && len > 500) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Threads caption exceeds 500 character limit.",
        path: ["caption"],
      });
    } else if (data.platform === "PINTEREST" && len > 500) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pinterest caption exceeds 500 character limit.",
        path: ["caption"],
      });
    } else if (data.platform === "LINKEDIN" && len > 3000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "LinkedIn post exceeds 3,000 character limit.",
        path: ["caption"],
      });
    } else if (data.platform === "YOUTUBE") {
      if (len > 5000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "YouTube description exceeds 5,000 character limit.",
          path: ["caption"],
        });
      }
      if (data.title && data.title.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "YouTube video title exceeds 100 character limit.",
          path: ["title"],
        });
      }
    }
  });

export type PlatformVariantInput = z.infer<typeof platformVariantSchema>;

export const postMediaInputSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
  displayOrder: z.number().int().min(0).default(0),
  caption: z.string().max(1000).nullable().optional(),
});

export type PostMediaInput = z.infer<typeof postMediaInputSchema>;

export const createSocialPostSchema = z.object({
  title: z.string().trim().min(1, "Post title is required.").max(255),
  description: z.string().trim().max(5000).nullable().optional(),
  content: z.string().nullable().optional(),
  internalNotes: z.string().trim().max(5000).nullable().optional(),
  status: socialPostStatusEnum.default("DRAFT"),
  priority: socialPostPriorityEnum.default("NORMAL"),
  plannedAt: z
    .union([
      z.string().datetime({ offset: true }),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
      z.date(),
    ])
    .nullable()
    .optional(),
  timezone: z.string().trim().default("Asia/Kolkata"),
  campaignId: z.string().uuid("Invalid campaign ID").nullable().optional(),
  contentPillarId: z.string().uuid("Invalid content pillar ID").nullable().optional(),
  platforms: z.array(platformVariantSchema).optional().default([]),
  media: z.array(postMediaInputSchema).optional().default([]),
  hashtagIds: z.array(z.string().uuid()).optional().default([]),
  reminderOffsets: z.array(z.number().int().min(0)).optional().default([]),
});

export type CreateSocialPostInput = z.input<typeof createSocialPostSchema>;

export const updateSocialPostSchema = createSocialPostSchema.partial();
export type UpdateSocialPostInput = z.input<typeof updateSocialPostSchema>;

export const reschedulePostSchema = z.object({
  plannedAt: z.union([
    z.string().datetime({ offset: true }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
    z.date(),
  ]),
});

export type ReschedulePostInput = z.input<typeof reschedulePostSchema>;

export const statusTransitionSchema = z.object({
  status: socialPostStatusEnum,
  notes: z.string().trim().max(1000).optional(),
});

export type StatusTransitionInput = z.input<typeof statusTransitionSchema>;

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required.").max(255),
  description: z.string().trim().max(5000).nullable().optional(),
  objective: z.string().trim().max(1000).nullable().optional(),
  startDate: z
    .union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}/), z.date()])
    .nullable()
    .optional(),
  endDate: z
    .union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}/), z.date()])
    .nullable()
    .optional(),
  status: campaignStatusEnum.default("PLANNING"),
  platforms: z.array(socialPlatformEnum).optional().default([]),
  internalNotes: z.string().trim().max(5000).nullable().optional(),
});

export type CreateCampaignInput = z.input<typeof createCampaignSchema>;
export const updateCampaignSchema = createCampaignSchema.partial();
export type UpdateCampaignInput = z.input<typeof updateCampaignSchema>;

export const createPillarSchema = z.object({
  name: z.string().trim().min(1, "Content pillar name is required.").max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Please enter a valid hex color code.")
    .default("#00D4FF"),
});

export type CreatePillarInput = z.input<typeof createPillarSchema>;
export const updatePillarSchema = createPillarSchema.partial();
export type UpdatePillarInput = z.input<typeof updatePillarSchema>;

export const createHashtagSchema = z.object({
  displayTag: z
    .string()
    .trim()
    .min(1, "Hashtag is required.")
    .max(100)
    .regex(/^[#]?[a-zA-Z0-9_]+$/, "Hashtag must contain only letters, numbers, and underscores."),
  category: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type CreateHashtagInput = z.input<typeof createHashtagSchema>;
export const updateHashtagSchema = createHashtagSchema.partial();
export type UpdateHashtagInput = z.input<typeof updateHashtagSchema>;

export const createHashtagCollectionSchema = z.object({
  name: z.string().trim().min(1, "Collection name is required.").max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Please enter a valid hex color code.")
    .default("#7A3FFF"),
  hashtagIds: z.array(z.string().uuid()).optional().default([]),
});

export type CreateHashtagCollectionInput = z.input<typeof createHashtagCollectionSchema>;
export const updateHashtagCollectionSchema = createHashtagCollectionSchema.partial();
export type UpdateHashtagCollectionInput = z.input<typeof updateHashtagCollectionSchema>;
