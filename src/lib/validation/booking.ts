import { z } from "zod";

// Shared between the public booking API route and the client-side booking
// form, so client and server validation can never drift.

export const customerSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional(),
  preferred_channel: z.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
});

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

  return errors;
}
