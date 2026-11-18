export type ReminderPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export type ReminderStatus =
  | "PENDING"
  | "SENT"
  | "COMPLETED"
  | "SNOOZED"
  | "CANCELLED";

export type RecurrenceRule =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM";

export type MissedReminderPolicy = "NOTIFY_IMMEDIATELY" | "SKIP";

export type ReminderViewSection =
  | "all"
  | "today"
  | "upcoming"
  | "overdue"
  | "recurring"
  | "completed"
  | "cancelled";

export type ReminderSection = ReminderViewSection;

export interface ReminderDto {
  id: string;
  userId: string;
  taskId: string | null;
  meetingId: string | null;
  title: string;
  description: string | null;
  dueAt: Date;
  isCompleted: boolean;
  status: ReminderStatus;
  priority: ReminderPriority;

  // Recurrence
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: number[];
  recurrenceDayOfMonth: number | null;
  recurrenceMonth: number | null;
  recurrenceEndAt: Date | null;
  nextRunAt: Date | null;

  // Offset
  offsetMinutes: number | null;

  // Snooze
  snoozedUntil: Date | null;
  snoozeCount: number;

  // Lifecycle
  lastNotifiedAt: Date | null;
  completedAt: Date | null;
  deletedAt: Date | null;
  missedPolicy: MissedReminderPolicy;
  jobId: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Associated Entities
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
  } | null;

  meeting?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    location: string | null;
    status: string;
  } | null;

  deliveriesCount?: number;
}

export interface ReminderDeliveryDto {
  id: string;
  reminderId: string;
  userId: string;
  scheduledAt: Date;
  deliveredAt: Date;
  status: "DELIVERED" | "MISSED" | "FAILED" | "SNOOZED";
  channel: "IN_APP" | "BROWSER";
  error: string | null;
}

export interface ReminderFilters {
  section?: ReminderViewSection;
  search?: string;
  priority?: ReminderPriority;
  status?: ReminderStatus;
  isRecurring?: boolean;
  taskId?: string;
  meetingId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "dueAt" | "priority" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ReminderStats {
  total: number;
  today: number;
  upcoming: number;
  overdue: number;
  recurring: number;
  completed: number;
  cancelled: number;
  snoozed: number;
}

export interface UserReminderSettingsDto {
  timezone: string;
  soundEnabled: boolean;
  soundTheme: string;
  defaultSnoozeMinutes: number;
  missedReminderPolicy: string;
  notificationBrowser: boolean;
}
