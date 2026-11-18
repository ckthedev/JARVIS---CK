import { z } from "zod";

export const reminderPrioritySchema = z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]);
export const reminderStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "COMPLETED",
  "SNOOZED",
  "CANCELLED",
]);
export const recurrenceRuleSchema = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
  "CUSTOM",
]);

export const createReminderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  description: z.string().trim().max(2000, "Description max 2000 characters").optional().nullable(),
  dueAt: z.union([z.string(), z.date()], {
    required_error: "Due date and time is required",
  }),
  priority: reminderPrioritySchema.optional().default("NORMAL"),
  taskId: z.string().uuid("Invalid task ID").optional().nullable(),
  meetingId: z.string().uuid("Invalid meeting ID").optional().nullable(),
  offsetMinutes: z.number().int().min(0).max(10080).optional().nullable(), // up to 7 days
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema.optional().nullable(),
  recurrenceInterval: z.number().int().min(1).max(365).optional().default(1),
  recurrenceDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional().default([]),
  recurrenceDayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  recurrenceMonth: z.number().int().min(1).max(12).optional().nullable(),
  recurrenceEndAt: z.union([z.string(), z.date()]).optional().nullable(),
  missedPolicy: z.enum(["NOTIFY_IMMEDIATELY", "SKIP"]).optional().default("NOTIFY_IMMEDIATELY"),
});

export const updateReminderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  dueAt: z.union([z.string(), z.date()]).optional(),
  priority: reminderPrioritySchema.optional(),
  status: reminderStatusSchema.optional(),
  taskId: z.string().uuid("Invalid task ID").optional().nullable(),
  meetingId: z.string().uuid("Invalid meeting ID").optional().nullable(),
  offsetMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: recurrenceRuleSchema.optional().nullable(),
  recurrenceInterval: z.number().int().min(1).max(365).optional(),
  recurrenceDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  recurrenceDayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  recurrenceMonth: z.number().int().min(1).max(12).optional().nullable(),
  recurrenceEndAt: z.union([z.string(), z.date()]).optional().nullable(),
  missedPolicy: z.enum(["NOTIFY_IMMEDIATELY", "SKIP"]).optional(),
});

export const snoozeReminderSchema = z.object({
  durationMinutes: z.number().int().min(1).max(43200).optional(), // up to 30 days
  customDate: z.union([z.string(), z.date()]).optional(),
}).refine((data) => data.durationMinutes !== undefined || data.customDate !== undefined, {
  message: "Either durationMinutes or customDate must be provided",
});

export const updateReminderSettingsSchema = z.object({
  timezone: z.string().min(1).max(50).optional(),
  soundEnabled: z.boolean().optional(),
  soundTheme: z.string().min(1).max(30).optional(),
  defaultSnoozeMinutes: z.number().int().min(1).max(1440).optional(),
  missedReminderPolicy: z.enum(["NOTIFY_IMMEDIATELY", "SKIP_OLDER"]).optional(),
  notificationBrowser: z.boolean().optional(),
});

export type CreateReminderInput = z.input<typeof createReminderSchema>;
export type UpdateReminderInput = z.input<typeof updateReminderSchema>;
export type SnoozeReminderInput = z.input<typeof snoozeReminderSchema>;
export type UpdateReminderSettingsInput = z.input<typeof updateReminderSettingsSchema>;
