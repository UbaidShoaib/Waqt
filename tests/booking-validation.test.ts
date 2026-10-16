import { describe, expect, it } from "vitest";
import { validateContact, type ContactInput } from "../src/lib/validation/booking";

const base: ContactInput = {
  name: "Jane Doe",
  phone: "",
  email: "",
  preferredChannel: "whatsapp",
  messagingConsent: true,
};

describe("validateContact", () => {
  it("is valid with only a phone number", () => {
    expect(validateContact({ ...base, phone: "+15551234567" })).toEqual({});
  });

  it("is valid with only an email", () => {
    expect(validateContact({ ...base, email: "jane@example.com" })).toEqual({});
  });

  it("requires phone or email when neither is provided", () => {
    const errors = validateContact(base);
    expect(errors.contact).toBeDefined();
  });

  it("rejects an invalid email format", () => {
    const errors = validateContact({ ...base, email: "not-an-email" });
    expect(errors.email).toBeDefined();
  });

  it("rejects an empty name", () => {
    const errors = validateContact({ ...base, name: "", phone: "+15551234567" });
    expect(errors.name).toBeDefined();
  });

  it("rejects a name over 120 characters", () => {
    const errors = validateContact({
      ...base,
      name: "a".repeat(121),
      phone: "+15551234567",
    });
    expect(errors.name).toBeDefined();
  });

  it("accepts both phone and email provided", () => {
    expect(
      validateContact({ ...base, phone: "+15551234567", email: "jane@example.com" })
    ).toEqual({});
  });

  it("requires messaging consent when a phone number is given", () => {
    const errors = validateContact({ ...base, phone: "+15551234567", messagingConsent: false });
    expect(errors.consent).toBeDefined();
  });

  it("does not require consent for email-only bookings", () => {
    expect(
      validateContact({ ...base, email: "jane@example.com", messagingConsent: false })
    ).toEqual({});
  });

  it("accepts spaced international numbers and rejects local-only ones", () => {
    expect(validateContact({ ...base, phone: "+92 300 123-4567" })).toEqual({});
    expect(validateContact({ ...base, phone: "03001234567" }).phone).toBeDefined();
  });
});
