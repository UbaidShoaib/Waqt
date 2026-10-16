// Slot-availability calculation (TRD §15: unit-test overlaps + timezone edges).
// All timestamps stored UTC; slots computed in the business's stored timezone.

export interface AvailabilityRule {
  day_of_week: number; // 0 = Sunday
  start_time: string; // "09:00:00"
  end_time: string; // "17:00:00"
}

export interface ExistingBooking {
  starts_at: string; // ISO UTC
  ends_at: string; // ISO UTC
}

export interface Slot {
  starts_at: string; // ISO UTC
  ends_at: string; // ISO UTC
}

/**
 * Compute open slots for one calendar date (in the business's timezone).
 * Steps: expand availability rules for that weekday into candidate slots of
 * `durationMin`, convert to UTC, drop candidates overlapping an existing
 * confirmed booking, drop candidates in the past.
 */
export function computeSlots(opts: {
  date: string; // "2026-07-22" — a date in the business's timezone
  timezone: string; // IANA, e.g. "Asia/Karachi"
  durationMin: number;
  rules: AvailabilityRule[];
  existing: ExistingBooking[];
  now?: Date;
}): Slot[] {
  const { date, timezone, durationMin, rules, existing } = opts;
  const now = opts.now ?? new Date();

  const dayOfWeek = zonedDayOfWeek(date, timezone);
  const todaysRules = rules.filter((r) => r.day_of_week === dayOfWeek);

  const slots: Slot[] = [];
  for (const rule of todaysRules) {
    let cursor = zonedTimeToUtc(date, rule.start_time, timezone);
    const windowEnd = zonedTimeToUtc(date, rule.end_time, timezone);

    while (cursor.getTime() + durationMin * 60_000 <= windowEnd.getTime()) {
      const end = new Date(cursor.getTime() + durationMin * 60_000);
      const overlaps = existing.some(
        (b) =>
          cursor.getTime() < new Date(b.ends_at).getTime() &&
          end.getTime() > new Date(b.starts_at).getTime()
      );
      if (!overlaps && cursor.getTime() > now.getTime()) {
        slots.push({ starts_at: cursor.toISOString(), ends_at: end.toISOString() });
      }
      cursor = end;
    }
  }
  return slots;
}

/** Day of week (0=Sun) for a calendar date in a given IANA timezone. */
export function zonedDayOfWeek(date: string, timezone: string): number {
  const probe = new Date(`${date}T12:00:00Z`);
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(probe);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

/**
 * Convert a wall-clock time on a date in `timezone` to a UTC Date.
 * Iterative offset resolution — handles DST transitions without a heavy
 * date library dependency.
 */
export function zonedTimeToUtc(date: string, time: string, timezone: string): Date {
  const naive = new Date(`${date}T${time.padEnd(8, ":00").slice(0, 8)}Z`);
  let guess = naive;
  for (let i = 0; i < 2; i++) {
    const offsetMs = tzOffsetMs(guess, timezone);
    guess = new Date(naive.getTime() - offsetMs);
  }
  return guess;
}

function tzOffsetMs(at: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(at).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "00" : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - at.getTime();
}

/** Next calendar date after "YYYY-MM-DD" (pure date arithmetic, no tz). */
export function nextDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * UTC [start, end) bounds of a calendar date in `timezone`. Use this, not
 * `${date}T00:00:00Z`, when querying bookings for a business's local day.
 */
export function zonedDayRangeUtc(date: string, timezone: string): { start: Date; end: Date } {
  return {
    start: zonedTimeToUtc(date, "00:00:00", timezone),
    end: zonedTimeToUtc(nextDate(date), "00:00:00", timezone),
  };
}
