import { FileDto } from "@/modules/files/types";
import { ReminderDto } from "@/modules/reminders/types";

export type MeetingType = "ONLINE" | "PHYSICAL" | "PHONE";
export type MeetingPriority = "HIGH" | "NORMAL" | "LOW";
export type MeetingStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "NO_SHOW";

export type AttendeeStatus =
  | "INVITED"
  | "ACCEPTED"
  | "DECLINED"
  | "TENTATIVE"
  | "ATTENDED"
  | "ABSENT";

export type MeetingSection =
  | "overview"
  | "all"
  | "today"
  | "upcoming"
  | "calendar"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "past";

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

export interface MeetingAttendeeDto {
  id: string;
  meetingId: string;
  name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  role: string | null;
  status: AttendeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingAgendaItemDto {
  id: string;
  meetingId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  sortOrder: number;
  isCompleted: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingLinkedNoteSummary {
  id: string;
  title: string;
  content: string;
  plainText: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingNoteLinkDto {
  id: string;
  meetingId: string;
  noteId: string;
  discussionSummary: string | null;
  keyDecisions: string | null;
  importantPoints: string | null;
  followUpInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
  note?: MeetingLinkedNoteSummary | null;
}

export interface MeetingAttachmentDto {
  id: string;
  meetingId: string;
  fileId: string;
  createdAt: Date;
  file?: FileDto | null;
}

export interface MeetingTaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
}

export interface MeetingDto {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
  meetingType: MeetingType;
  priority: MeetingPriority;
  location: string | null;
  meetingUrl: string | null;
  status: MeetingStatus;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Hydrated details
  attendees?: MeetingAttendeeDto[];
  agendaItems?: MeetingAgendaItemDto[];
  notes?: MeetingNoteLinkDto[];
  tasks?: MeetingTaskSummary[];
  attachments?: MeetingAttachmentDto[];
  reminders?: ReminderDto[];

  // Counts for list view
  attendeeCount?: number;
  agendaCount?: number;
  taskCount?: number;
  attachmentCount?: number;
}

export interface MeetingFilters {
  section?: MeetingSection;
  search?: string;
  status?: MeetingStatus;
  meetingType?: MeetingType;
  priority?: MeetingPriority;
  startDate?: Date;
  endDate?: Date;
  participant?: string;
  sortBy?: "startTime" | "title" | "priority" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface MeetingStats {
  total: number;
  today: number;
  upcoming: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
  noShow: number;
  past: number;
  highPriorityCount: number;
}
