import { RecurrenceRule } from "./types";

export interface RecurrenceOptions {
  rule: RecurrenceRule;
  interval?: number;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  dayOfMonth?: number | null; // 1 to 31
  month?: number | null; // 1 to 12
  endDate?: Date | null;
  timezone?: string;
}

/**
 * Returns the number of days in a given year and month (1-12).
 * Correctly accounts for leap years.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Checks if a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Helper to get local date parts in target timezone.
 */
function getLocalDateParts(date: Date, timezone = "Asia/Kolkata") {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    weekday: "narrow",
  });

  const parts = formatter.formatToParts(date);
  const findVal = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);

  // Weekday (0=Sun, 1=Mon, ..., 6=Sat)
  // Intl weekday in en-US: Sun, Mon, Tue, etc.
  const dayNameFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const shortName = dayNameFormatter.format(date);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = dayMap[shortName] ?? date.getUTCDay();

  return {
    year: findVal("year"),
    month: findVal("month"), // 1-12
    day: findVal("day"),
    hour: findVal("hour"),
    minute: findVal("minute"),
    second: findVal("second"),
    weekday,
  };
}

/**
 * Calculate the next occurrence timestamp strictly after `afterDate`.
 * Returns null if the recurrence has ended or is invalid.
 */
export function calculateNextOccurrence(
  currentDueAt: Date,
  options: RecurrenceOptions,
  afterDate: Date = currentDueAt
): Date | null {
  const {
    rule,
    interval = 1,
    daysOfWeek = [],
    dayOfMonth,
    month,
    endDate,
    timezone = "Asia/Kolkata",
  } = options;

  const stepInterval = Math.max(1, interval);
  const targetTime = afterDate.getTime();

  // If there's an end date and we're already past it, no next occurrence
  if (endDate && targetTime >= endDate.getTime()) {
    return null;
  }

  const parts = getLocalDateParts(currentDueAt, timezone);
  const hour = parts.hour;
  const minute = parts.minute;
  const second = parts.second;

  let candidate: Date | null = null;

  switch (rule) {
    case "DAILY": {
      // Add interval days until strictly greater than afterDate
      let checkDate = new Date(currentDueAt.getTime());
      while (checkDate.getTime() <= targetTime) {
        checkDate = new Date(checkDate.getTime() + stepInterval * 24 * 60 * 60 * 1000);
      }
      candidate = checkDate;
      break;
    }

    case "WEEKLY": {
      // If specific days of week provided (e.g. [1, 3, 5] for Mon, Wed, Fri)
      const validDays = daysOfWeek.length > 0 ? Array.from(new Set(daysOfWeek)).sort() : [parts.weekday];
      
      let checkDate = new Date(currentDueAt.getTime());
      // Step day-by-day looking for matching weekday
      // If we cycle through 7 days, we apply the interval weeks
      let safetyCounter = 0;
      while (safetyCounter < 500) {
        checkDate = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
        safetyCounter++;

        const checkParts = getLocalDateParts(checkDate, timezone);
        if (validDays.includes(checkParts.weekday)) {
          if (checkDate.getTime() > targetTime) {
            candidate = checkDate;
            break;
          }
        }
      }
      break;
    }

    case "MONTHLY": {
      // Target day of month (e.g. 15th, or 31st)
      const targetDay = dayOfMonth || parts.day;
      const checkParts = getLocalDateParts(currentDueAt, timezone);
      let year = checkParts.year;
      let m = checkParts.month; // 1-12

      let safety = 0;
      while (safety < 240) {
        safety++;
        m += stepInterval;
        while (m > 12) {
          m -= 12;
          year += 1;
        }

        // Clamp to days in target month (e.g. 31st clamped to 28/29 in Feb, 30 in Apr)
        const daysInTargetMonth = getDaysInMonth(year, m);
        const actualDay = Math.min(targetDay, daysInTargetMonth);

        // Construct Date in target timezone
        const nextDate = constructDateInTimezone(year, m, actualDay, hour, minute, second, timezone);
        if (nextDate.getTime() > targetTime) {
          candidate = nextDate;
          break;
        }
      }
      break;
    }

    case "YEARLY": {
      const targetMonth = month || parts.month;
      const targetDay = dayOfMonth || parts.day;
      const checkParts = getLocalDateParts(currentDueAt, timezone);
      let year = checkParts.year;

      let safety = 0;
      while (safety < 50) {
        safety++;
        year += stepInterval;

        const daysInTargetMonth = getDaysInMonth(year, targetMonth);
        const actualDay = Math.min(targetDay, daysInTargetMonth);

        const nextDate = constructDateInTimezone(year, targetMonth, actualDay, hour, minute, second, timezone);
        if (nextDate.getTime() > targetTime) {
          candidate = nextDate;
          break;
        }
      }
      break;
    }

    case "CUSTOM": {
      // If weekdays are specified, treat like weekly with interval
      if (daysOfWeek && daysOfWeek.length > 0) {
        return calculateNextOccurrence(
          currentDueAt,
          { ...options, rule: "WEEKLY" },
          afterDate
        );
      }
      // Otherwise default to interval in days
      return calculateNextOccurrence(
        currentDueAt,
        { ...options, rule: "DAILY" },
        afterDate
      );
    }
  }

  // Check if candidate exceeds endDate
  if (candidate && endDate && candidate.getTime() > endDate.getTime()) {
    return null;
  }

  return candidate;
}

/**
 * Constructs a Date object representing the given local time in target timezone.
 */
export function constructDateInTimezone(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezone: string
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoBase = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;

  // For Asia/Kolkata: offset is always UTC+5:30 (+05:30) with no daylight saving time
  if (timezone === "Asia/Kolkata") {
    return new Date(`${isoBase}+05:30`);
  }

  // Fallback for general timezones:
  // Create UTC date and adjust by difference between local and target timezone
  const approxUtc = new Date(`${isoBase}Z`);
  const parts = getLocalDateParts(approxUtc, timezone);
  const diffMinutes =
    (parts.hour - hour) * 60 +
    (parts.minute - minute) +
    (parts.day - day) * 1440;
  return new Date(approxUtc.getTime() - diffMinutes * 60 * 1000);
}
