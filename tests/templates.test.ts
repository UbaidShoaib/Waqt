import { describe, expect, it } from "vitest";
import { buildMessage, manualReminderText, whatsappLink } from "../src/lib/messaging/templates";

const ctx = {
  businessName: "Noor Salon",
  timezone: "Asia/Karachi",
  serviceName: "Cut & blow-dry",
  customerName: "Sara Khan",
  startsAt: "2026-10-19T05:00:00.000Z", // 10:00 AM in Karachi
  bookingUrl: "https://waqt.io/b/noor-salon",
};

describe("message templates", () => {
  it("formats times in the business timezone and greets by first name", () => {
    const { subject, body } = buildMessage("confirmation", ctx);
    expect(subject).toContain("Mon, Oct 19 at 10:00 AM");
    expect(body.startsWith("Hi Sara,")).toBe(true);
  });

  it("includes a rebooking link on cancellation", () => {
    expect(buildMessage("cancellation", ctx).body).toContain(ctx.bookingUrl);
  });

  it("builds a wa.me link with digits only and encoded text", () => {
    const link = whatsappLink("+92 321 765-4321", manualReminderText(ctx));
    expect(link.startsWith("https://wa.me/923217654321?text=Hi%20Sara%2C")).toBe(true);
  });
});
