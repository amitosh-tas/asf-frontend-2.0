import { formatDateInTimeZone, getReportTimeZone } from "./timezone";

export type DateRangePreset = "7D" | "14D" | "30D" | "90D" | "custom";

export interface DateRange {
  from: string;
  to: string;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Calendar arithmetic on a "YYYY-MM-DD" string (no timezone involved, so no DST surprises). */
function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Today's date in the company's timezone (once known from a report response), otherwise in the browser's.
 * The backend treats "YYYY-MM-DD" as WHOLE local days of the company, so "today" must be the company's today.
 */
export function getTodayDate(timeZone: string | null = getReportTimeZone()): string {
  return timeZone ? formatDateInTimeZone(new Date(), timeZone) : formatLocalDate(new Date());
}

export function getPresetDateRange(
  days: 7 | 14 | 30 | 90,
  today: Date = new Date(),
  timeZone: string | null = getReportTimeZone(),
): DateRange {
  const to = timeZone ? formatDateInTimeZone(today, timeZone) : formatLocalDate(today);
  return { from: addDaysToDateString(to, -(days - 1)), to };
}

export function isValidDateRange(range: DateRange, today = getTodayDate()) {
  return Boolean(range.from && range.to) &&
    range.from <= range.to &&
    range.to <= today;
}
