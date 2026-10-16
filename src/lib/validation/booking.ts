import { z } from "zod";

// Shared between the public booking API route and the client-side booking
// form, so client and server validation can never drift.

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120, "Name is too long"),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+[1-9]\d{6,14}$/, "Use international format, e.g. +923001234567"))
    .optional(),
  email: z.string().email("Enter a valid email address").optional(),
  preferred_channel: z.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
  messaging_consent: z.boolean().default(false),
});

// Bump when CONSENT_TEXT changes; stored with each customer as proof of what
// they agreed to.
export const CONSENT_TEXT_VERSION = "2026-10-17";
export const consentText = (businessName: string) =>
  `I agree to receive booking confirmations and reminders from ${businessName} by WhatsApp, SMS, or email. Reply STOP to opt out at any time.`;

export const createBookingSchema = z.object({
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  customer: customerSchema,
  source: z.enum(["direct_link", "widget"]).default("direct_link"),
});

export interface ContactInput {
  name: string;
  phone: string;
  email: string;
  preferredChannel: "whatsapp" | "sms" | "email";
  messagingConsent: boolean;
}

/**
 * Client-side mirror of the server's validation (zod schema + the
 * phone-or-email rule, which isn't expressible as a single zod field rule).
 * Returns field -> message; an empty object means the input is valid. The
 * server remains the source of truth — this only gives the user instant
 * feedback before the network round-trip.
 */
export function validateContact(input: ContactInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const parsed = customerSchema.safeParse({
    name: input.name,
    phone: input.phone || undefined,
    email: input.email || undefined,
    preferred_channel: input.preferredChannel,
    messaging_consent: input.messagingConsent,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.name?.[0]) errors.name = fieldErrors.name[0];
    if (fieldErrors.phone?.[0]) errors.phone = fieldErrors.phone[0];
    if (fieldErrors.email?.[0]) errors.email = fieldErrors.email[0];
  }

  if (!errors.phone && !errors.email && !input.phone && !input.email) {
    errors.contact = "Enter a phone number or email so we can confirm your booking.";
  }

  if (input.phone && !input.messagingConsent) {
    errors.consent = "Please agree to receive booking messages, or leave the phone number blank.";
  }

  return errors;
}
