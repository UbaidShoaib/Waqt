import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { sendMessage } = await import("../src/lib/messaging/send");

const msg = {
  bookingId: "b1",
  type: "confirmation" as const,
  subject: "s",
  body: "b",
};

afterEach(() => vi.unstubAllEnvs());

describe("sendMessage without paid channels", () => {
  it("falls back from WhatsApp to email", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const r = await sendMessage({ ...msg, preferredChannel: "whatsapp", to: { phone: "+923001234567", email: "a@b.test" } });
    expect(r).toEqual({ channel: "email", status: "sent" });
  });

  it("fails for phone-only customers (owner uses the WhatsApp button)", async () => {
    const r = await sendMessage({ ...msg, preferredChannel: "whatsapp", to: { phone: "+923001234567" } });
    expect(r.status).toBe("failed");
  });
});
