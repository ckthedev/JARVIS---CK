import { z } from "zod";

export const meetingTypeEnum = z.enum(["ONLINE", "PHYSICAL", "PHONE"]);
export const meetingPriorityEnum = z.enum(["HIGH", "NORMAL", "LOW"]);
export const meetingStatusEnum = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
  "NO_SHOW",
]);

export const attendeeStatusEnum = z.enum([
  "INVITED",
  "ACCEPTED",
  "DECLINED",
  "TENTATIVE",
  "ATTENDED",
  "ABSENT",
]);

export const attendeeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Participant name is required.").max(255),
  email: z
    .string()
    .trim()
    .email("Invalid email format.")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(50).nullable().optional(),
  organization: z.string().trim().max(255).nullable().optional(),
  role: z.string().trim().max(100).nullable().optional(),
  status: attendeeStatusEnum.default("INVITED"),
});

export type AttendeeInput = z.input<typeof attendeeSchema>;

export const agendaItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Agenda item title is required.").max(255),
  description: z.string().trim().max(2000).nullable().optional(),
  durationMinutes: z.number().int().min(1).max(720).default(15),
  sortOrder: z.number().int().min(0).default(0),
  isCompleted: z.boolean().default(false),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export type AgendaItemInput = z.input<typeof agendaItemSchema>;

export const createMeetingSchema = z
  .object({
    title: z.string().trim().min(1, "Meeting title is required.").max(255),
    description: z.string().trim().max(5000).nullable().optional(),
    startTime: z.union([
      z.string().datetime({ offset: true }),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
      z.date(),
    ]),
    endTime: z.union([
      z.string().datetime({ offset: true }),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
      z.date(),
    ]),
    timezone: z.string().trim().default("Asia/Kolkata"),
    meetingType: meetingTypeEnum.default("ONLINE"),
    priority: meetingPriorityEnum.default("NORMAL"),
    location: z.string().trim().max(500).nullable().optional(),
    meetingUrl: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val)),
    attendees: z.array(attendeeSchema).optional().default([]),
    agendaItems: z.array(agendaItemSchema).optional().default([]),
    reminderOffsets: z.array(z.number().int().min(0)).optional().default([]),
    attachmentFileIds: z.array(z.string().uuid()).optional().default([]),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      return end > start;
    },
    {
      message: "Meeting end time must be after start time.",
      path: ["endTime"],
    }
  );

export type CreateMeetingInput = z.input<typeof createMeetingSchema>;

export const updateMeetingSchema = z
  .object({
    title: z.string().trim().min(1, "Meeting title is required.").max(255).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    startTime: z
      .union([
        z.string().datetime({ offset: true }),
        z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
        z.date(),
      ])
      .optional(),
    endTime: z
      .union([
        z.string().datetime({ offset: true }),
        z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
        z.date(),
      ])
      .optional(),
    timezone: z.string().trim().optional(),
    meetingType: meetingTypeEnum.optional(),
    priority: meetingPriorityEnum.optional(),
    location: z.string().trim().max(500).nullable().optional(),
    meetingUrl: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val)),
    status: meetingStatusEnum.optional(),
    attendees: z.array(attendeeSchema).optional(),
    agendaItems: z.array(agendaItemSchema).optional(),
    reminderOffsets: z.array(z.number().int().min(0)).optional(),
    attachmentFileIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime).getTime() > new Date(data.startTime).getTime();
      }
      return true;
    },
    {
      message: "Meeting end time must be after start time.",
      path: ["endTime"],
    }
  );

export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

export const rescheduleMeetingSchema = z
  .object({
    startTime: z.union([
      z.string().datetime({ offset: true }),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
      z.date(),
    ]),
    endTime: z.union([
      z.string().datetime({ offset: true }),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
      z.date(),
    ]),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      return end > start;
    },
    {
      message: "Rescheduled end time must be after start time.",
      path: ["endTime"],
    }
  );

export type RescheduleMeetingInput = z.infer<typeof rescheduleMeetingSchema>;

export const meetingNoteSchema = z.object({
  noteId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(255).optional(),
  content: z.string().optional(),
  discussionSummary: z.string().trim().max(5000).nullable().optional(),
  keyDecisions: z.string().trim().max(5000).nullable().optional(),
  importantPoints: z.string().trim().max(5000).nullable().optional(),
  followUpInfo: z.string().trim().max(5000).nullable().optional(),
});

export type MeetingNoteInput = z.infer<typeof meetingNoteSchema>;

export const meetingTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required.").max(255),
  description: z.string().trim().max(5000).nullable().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).default("NORMAL"),
  dueDate: z
    .union([
      z.string().datetime({ offset: true }),
      z.string().regex(/^\d{4}-\d{2}-\d{2}/),
      z.date(),
    ])
    .nullable()
    .optional(),
});

export type MeetingTaskInput = z.infer<typeof meetingTaskSchema>;
