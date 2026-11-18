export const APP_TIMEZONE = "Asia/Kolkata";

export interface KolkataDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dateString: string; // YYYY-MM-DD
}

/**
 * Returns date parts in Asia/Kolkata timezone (en-CA gives YYYY-MM-DD).
 */
export function getKolkataDateParts(date: Date = new Date()): KolkataDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateString = formatter.format(date);
  const [year, month, day] = dateString.split("-").map(Number);
  return { year, month, day, dateString };
}

/**
 * Get start of day in Asia/Kolkata as a Date object in UTC.
 */
export function getKolkataStartOfDay(date: Date = new Date()): Date {
  const { year, month, day } = getKolkataDateParts(date);
  // Asia/Kolkata is UTC+5:30 (offset -330 minutes)
  // Midnight IST = 18:30 UTC of previous day
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return new Date(`${year}-${m}-${d}T00:00:00+05:30`);
}

/**
 * Get end of day in Asia/Kolkata as a Date object.
 */
export function getKolkataEndOfDay(date: Date = new Date()): Date {
  const { year, month, day } = getKolkataDateParts(date);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return new Date(`${year}-${m}-${d}T23:59:59.999+05:30`);
}

/**
 * Check if a due date is today in Asia/Kolkata.
 */
export function isDueTodayKolkata(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  const target = getKolkataDateParts(new Date(dueDate));
  const today = getKolkataDateParts();
  return target.dateString === today.dateString;
}

/**
 * Check if an incomplete task is overdue in Asia/Kolkata.
 * A task is overdue only if due date is strictly before today's date in Asia/Kolkata
 * AND task is not completed or cancelled.
 */
export function isOverdueKolkata(
  dueDate: Date | string | null | undefined,
  status?: string
): boolean {
  if (!dueDate) return false;
  if (status === "COMPLETED" || status === "CANCELLED") return false;
  const target = getKolkataDateParts(new Date(dueDate));
  const today = getKolkataDateParts();
  return target.dateString < today.dateString;
}

/**
 * Check if a due date is in the future (after today) in Asia/Kolkata.
 */
export function isUpcomingKolkata(
  dueDate: Date | string | null | undefined,
  status?: string
): boolean {
  if (!dueDate) return false;
  if (status === "COMPLETED" || status === "CANCELLED") return false;
  const target = getKolkataDateParts(new Date(dueDate));
  const today = getKolkataDateParts();
  return target.dateString > today.dateString;
}

/**
 * Check if task qualifies for "My Day":
 * Tasks due today OR incomplete tasks whose start date has arrived (<= today in Asia/Kolkata).
 */
export function isMyDayKolkata(
  dueDate: Date | string | null | undefined,
  startDate: Date | string | null | undefined,
  status?: string
): boolean {
  if (status === "COMPLETED" || status === "CANCELLED") return false;
  const today = getKolkataDateParts();

  if (dueDate) {
    const dueParts = getKolkataDateParts(new Date(dueDate));
    if (dueParts.dateString === today.dateString) {
      return true;
    }
  }

  if (startDate) {
    const startParts = getKolkataDateParts(new Date(startDate));
    if (startParts.dateString <= today.dateString) {
      return true;
    }
  }

  return false;
}

/**
 * Format a date nicely in Asia/Kolkata timezone.
 */
export function formatKolkataDate(
  date: Date | string | null | undefined,
  includeTime = false
): string {
  if (!date) return "";
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (includeTime) {
    options.hour = "numeric";
    options.minute = "2-digit";
    options.hour12 = true;
  }
  return new Intl.DateTimeFormat("en-US", options).format(d);
}
