import { describe, expect, it } from "vitest";
import { computeSlots, zonedDayOfWeek, zonedDayRangeUtc, zonedTimeToUtc } from "../src/lib/slots";

// Unit tests for slot-availability calculation (TRD §15):
// overlaps + timezone edge cases.

const KARACHI = "Asia/Karachi"; // UTC+5, no DST
const NEW_YORK = "America/New_York"; // DST edge cases

describe("zonedDayOfWeek", () => {
  it("resolves weekday in the business timezone, not UTC", () => {
    // 2026-07-22 is a Wednesday everywhere at noon local.
    expect(zonedDayOfWeek("2026-07-22", KARACHI)).toBe(3);
    expect(zonedDayOfWeek("2026-07-22", NEW_YORK)).toBe(3);
  });
});

describe("zonedTimeToUtc", () => {
  it("converts Karachi wall time to UTC (-5h)", () => {
    const utc = zonedTimeToUtc("2026-07-22", "09:00:00", KARACHI);
    expect(utc.toISOString()).toBe("2026-07-22T04:00:00.000Z");
  });

  it("handles US DST (EDT = UTC-4 in July)", () => {
    const utc = zonedTimeToUtc("2026-07-22", "09:00:00", NEW_YORK);
    expect(utc.toISOString()).toBe("2026-07-22T13:00:00.000Z");
  });
});

describe("computeSlots", () => {
  const rules = [{ day_of_week: 3, start_time: "09:00:00", end_time: "12:00:00" }];
  const past = new Date("2026-07-20T00:00:00Z"); // "now" well before the date

  it("expands a window into duration-sized slots", () => {
    const slots = computeSlots({
      date: "2026-07-22",
      timezone: KARACHI,
      durationMin: 60,
      rules,
      existing: [],
      now: past,
    });
    expect(slots).toHaveLength(3); // 9-10, 10-11, 11-12
    expect(slots[0].starts_at).toBe("2026-07-22T04:00:00.000Z");
  });

  it("drops slots overlapping an existing confirmed booking", () => {
    const slots = computeSlots({
      date: "2026-07-22",
      timezone: KARACHI,
      durationMin: 60,
      rules,
      existing: [
        { starts_at: "2026-07-22T05:00:00.000Z", ends_at: "2026-07-22T06:00:00.000Z" }, // 10-11 local
      ],
      now: past,
    });
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.starts_at)).not.toContain("2026-07-22T05:00:00.000Z");
  });

  it("returns nothing for a day with no rules", () => {
    const slots = computeSlots({
      date: "2026-07-23", // Thursday — rule above is Wednesday only
      timezone: KARACHI,
      durationMin: 60,
      rules,
      existing: [],
      now: past,
    });
    expect(slots).toHaveLength(0);
  });

  it("excludes slots in the past", () => {
    const slots = computeSlots({
      date: "2026-07-22",
      timezone: KARACHI,
      durationMin: 60,
      rules,
      existing: [],
      now: new Date("2026-07-22T05:30:00Z"), // 10:30 local — only 11-12 remains
    });
    expect(slots).toHaveLength(1);
  });

  it("does not emit a slot that would overrun the window end", () => {
    const slots = computeSlots({
      date: "2026-07-22",
      timezone: KARACHI,
      durationMin: 90,
      rules, // 3h window → two 90-min slots exactly
      existing: [],
      now: past,
    });
    expect(slots).toHaveLength(2);
  });
});

describe("zonedDayRangeUtc", () => {
  it("covers the business-local day, not the UTC day", () => {
    const { start, end } = zonedDayRangeUtc("2026-07-22", "Asia/Karachi");
    expect(start.toISOString()).toBe("2026-07-21T19:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-22T19:00:00.000Z");
  });
});
