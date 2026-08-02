// Date formatting helpers for the booking UI. All timezone-aware
// calculations mirror the technique in src/lib/slots.ts (anchor at
// T12:00:00Z, reformat in the target timezone) so "today"/"this date" always
// means the business's calendar day, not the browser's.

/** Format a UTC instant as "YYYY-MM-DD" in a given IANA timezone. */
export function formatDateInTimezone(date: Date, timezone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(date); // en-CA gives YYYY-MM-DD directly
}

/**
 * Generate `count` sequential calendar-date strings starting at "today" in
 * `timezone`. Anchoring each candidate at noon UTC before reformatting
 * avoids DST-transition bugs that naive local-date arithmetic would hit.
 */
export function upcomingDates(timezone: string, count: number, now?: Date): string[] {
  const today = formatDateInTimezone(now ?? new Date(), timezone);
  const anchor = new Date(`${today}T12:00:00Z`);

  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const candidate = new Date(anchor.getTime() + i * 86_400_000);
    dates.push(formatDateInTimezone(candidate, timezone));
  }
  return dates;
}

/** "Wed, Jul 22" for a "YYYY-MM-DD" date string, in a given timezone. */
export function formatDateLabel(dateStr: string, timezone: string): string {
  const probe = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(probe);
}

/** "9:00 AM" for an ISO UTC instant, formatted in a given timezone. */
export function formatSlotLabel(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoUtc));
}
