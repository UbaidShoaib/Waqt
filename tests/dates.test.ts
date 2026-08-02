import { describe, expect, it } from "vitest";
import {
  formatDateInTimezone,
  formatDateLabel,
  formatSlotLabel,
  upcomingDates,
} from "../src/lib/dates";

const KARACHI = "Asia/Karachi"; // UTC+5, no DST
const NEW_YORK = "America/New_York"; // DST edge cases

describe("formatDateInTimezone", () => {
  it("resolves the calendar date in the given timezone, not UTC", () => {
    // 11pm UTC is already the next calendar day in Karachi (UTC+5).
    expect(formatDateInTimezone(new Date("2026-07-22T23:00:00Z"), KARACHI)).toBe(
      "2026-07-23"
    );
    // Same instant is still "today" in New York (UTC-4 in July).
    expect(formatDateInTimezone(new Date("2026-07-22T23:00:00Z"), NEW_YORK)).toBe(
      "2026-07-22"
    );
  });
});

describe("upcomingDates", () => {
  it("returns count sequential dates starting today in the given timezone", () => {
    const dates = upcomingDates(KARACHI, 5, new Date("2026-07-22T06:00:00Z"));
    expect(dates).toEqual([
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
    ]);
  });

  it("stays sequential across a US DST spring-forward boundary", () => {
    // 2026-03-08 is the US spring-forward date (2am -> 3am EDT).
    const dates = upcomingDates(NEW_YORK, 5, new Date("2026-03-06T12:00:00Z"));
    expect(dates).toEqual([
      "2026-03-06",
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
  });

  it("stays sequential across a US DST fall-back boundary", () => {
    // 2026-11-01 is the US fall-back date (2am -> 1am EST).
    const dates = upcomingDates(NEW_YORK, 5, new Date("2026-10-30T12:00:00Z"));
    expect(dates).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
    ]);
  });

  it("has no duplicate dates", () => {
    const dates = upcomingDates(NEW_YORK, 14, new Date("2026-03-01T12:00:00Z"));
    expect(new Set(dates).size).toBe(dates.length);
  });
});

describe("formatDateLabel", () => {
  it("formats a date string as a short weekday + month + day", () => {
    expect(formatDateLabel("2026-07-22", KARACHI)).toBe("Wed, Jul 22");
  });
});

describe("formatSlotLabel", () => {
  it("formats a UTC instant as a local time in the given timezone", () => {
    expect(formatSlotLabel("2026-07-22T04:00:00.000Z", KARACHI)).toBe("9:00 AM");
    expect(formatSlotLabel("2026-07-22T13:00:00.000Z", NEW_YORK)).toBe("9:00 AM");
  });
});
