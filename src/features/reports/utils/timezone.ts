/**
 * Reports are calculated in the COMPANY's timezone ("a day" = the company's local day).
 * The backend returns that timezone as `period.tz` on every report; we remember it so the date presets
 * ("last 7 days", "today") follow the company's calendar rather than the browser's.
 */

import { useSyncExternalStore } from "react";

let cachedTimeZone: string | null = null;
const listeners = new Set<() => void>();

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function rememberReportTimeZone(value: unknown) {
  if (!isValidTimeZone(value) || value === cachedTimeZone) return;
  cachedTimeZone = value;
  listeners.forEach((listener) => listener());
}

export function getReportTimeZone(): string | null {
  return cachedTimeZone;
}

/** React hook: the company's timezone once a report has told us, otherwise null. */
export function useReportTimeZone(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getReportTimeZone,
    () => null,
  );
}

/** "YYYY-MM-DD" of an instant in a timezone (browser timezone when none is given). */
export function formatDateInTimeZone(date: Date, timeZone?: string | null): string {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : undefined;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
