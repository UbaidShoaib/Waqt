// Message copy for every booking notification. Shared by server sends
// (email) and the dashboard's click-to-chat WhatsApp links, so wording
// stays consistent across channels. Times are always in the business's
// timezone.

import type { MessageType } from "@/lib/messaging/send";
import { formatDateInTimezone, formatDateLabel, formatSlotLabel } from "@/lib/dates";

export interface MessageContext {
  businessName: string;
  timezone: string;
  serviceName: string;
  customerName: string;
  startsAt: string; // ISO UTC
  bookingUrl: string; // business's public booking page
}

export function whenLabel(startsAt: string, timezone: string): string {
  const date = formatDateLabel(formatDateInTimezone(new Date(startsAt), timezone), timezone);
  return `${date} at ${formatSlotLabel(startsAt, timezone)}`;
}

export function buildMessage(type: MessageType, ctx: MessageContext): { subject: string; body: string } {
  const when = whenLabel(ctx.startsAt, ctx.timezone);
  const hi = `Hi ${ctx.customerName.split(" ")[0]},`;
  switch (type) {
    case "confirmation":
      return {
        subject: `Booked: ${ctx.serviceName} at ${ctx.businessName}, ${when}`,
        body: `${hi}\n\nYour ${ctx.serviceName} at ${ctx.businessName} is confirmed for ${when}.\n\nWe'll remind you before your appointment. To change or cancel, please contact ${ctx.businessName}.`,
      };
    case "reminder_24h":
      return {
        subject: `Tomorrow: ${ctx.serviceName} at ${ctx.businessName}`,
        body: `${hi}\n\nA reminder that your ${ctx.serviceName} at ${ctx.businessName} is tomorrow, ${when}.\n\nSee you then!`,
      };
    case "reminder_1h":
      return {
        subject: `In 1 hour: ${ctx.serviceName} at ${ctx.businessName}`,
        body: `${hi}\n\nYour ${ctx.serviceName} at ${ctx.businessName} starts in about an hour (${when}).`,
      };
    case "cancellation":
      return {
        subject: `Cancelled: ${ctx.serviceName} at ${ctx.businessName}`,
        body: `${hi}\n\nYour ${ctx.serviceName} at ${ctx.businessName} on ${when} has been cancelled.\n\nBook a new time: ${ctx.bookingUrl}`,
      };
  }
}

/**
 * Free WhatsApp: a wa.me click-to-chat link the owner opens and sends from
 * their own WhatsApp — no Cloud API, no per-message cost.
 */
export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Day-agnostic reminder for the owner's manual WhatsApp send. */
export function manualReminderText(ctx: Omit<MessageContext, "bookingUrl">): string {
  return `Hi ${ctx.customerName.split(" ")[0]}, a reminder of your ${ctx.serviceName} at ${ctx.businessName} on ${whenLabel(ctx.startsAt, ctx.timezone)}. See you then!`;
}
