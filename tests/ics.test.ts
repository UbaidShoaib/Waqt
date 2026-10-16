import { describe, expect, it } from "vitest";
import { buildIcs } from "../src/lib/ics";
import { dayPeriod } from "../src/lib/dates";

describe("buildIcs", () => {
  it("emits UTC timestamps, an alarm, and escapes text", () => {
    const ics = buildIcs({
      uid: "b1",
      startsAt: "2026-10-18T05:45:00.000Z",
      endsAt: "2026-10-18T06:30:00.000Z",
      title: "Cut, blow-dry; Noor",
    });
    expect(ics).toContain("DTSTART:20261018T054500Z");
    expect(ics).toContain("SUMMARY:Cut\\, blow-dry\\; Noor");
    expect(ics).toContain("BEGIN:VALARM");
  });
});

describe("dayPeriod", () => {
  it("buckets by the business's local hour", () => {
    // 05:45Z = 10:45 in Karachi; 10:00Z = 15:00; 13:00Z = 18:00
    expect(dayPeriod("2026-10-18T05:45:00Z", "Asia/Karachi")).toBe("Morning");
    expect(dayPeriod("2026-10-18T10:00:00Z", "Asia/Karachi")).toBe("Afternoon");
    expect(dayPeriod("2026-10-18T13:00:00Z", "Asia/Karachi")).toBe("Evening");
  });
});
