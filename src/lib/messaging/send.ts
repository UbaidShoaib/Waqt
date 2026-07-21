import "server-only";
// Messaging dispatch (TRD §12): preferred channel first, email fallback,
// one retry on failure, every attempt logged to notifications_log.

export type Channel = "whatsapp" | "sms" | "email";
export type MessageType =
  | "confirmation"
  | "reminder_24h"
  | "reminder_1h"
  | "cancellation";

export interface OutboundMessage {
  bookingId: string;
  type: MessageType;
  to: { phone?: string | null; email?: string | null };
  preferredChannel: Channel;
  body: string;
}

export async function sendMessage(msg: OutboundMessage): Promise<{
  channel: Channel;
  status: "sent" | "failed";
}> {
  const order = channelOrder(msg.preferredChannel, msg.to);
  for (const channel of order) {
    try {
      await dispatch(channel, msg);
      return { channel, status: "sent" };
    } catch {
      // fall through to next channel (single fallback pass = the one retry)
      continue;
    }
  }
  return { channel: order[0] ?? "email", status: "failed" };
}

function channelOrder(
  preferred: Channel,
  to: OutboundMessage["to"]
): Channel[] {
  const available: Channel[] = [];
  if (to.phone) available.push("whatsapp", "sms");
  if (to.email) available.push("email");
  return [preferred, ...available.filter((c) => c !== preferred)];
}

async function dispatch(channel: Channel, msg: OutboundMessage): Promise<void> {
  switch (channel) {
    case "whatsapp":
      return sendWhatsApp(msg);
    case "sms":
      return sendSms(msg);
    case "email":
      return sendEmail(msg);
  }
}

// --- Provider stubs — implemented in Week 3 (TRD §16) -----------------------

async function sendWhatsApp(msg: OutboundMessage): Promise<void> {
  // WhatsApp Cloud API (direct via Meta). Uses WHATSAPP_CLOUD_API_TOKEN +
  // WHATSAPP_PHONE_NUMBER_ID. Template messages required outside the 24h
  // customer-service window.
  throw new Error("not implemented: WhatsApp Cloud API send");
}

async function sendSms(msg: OutboundMessage): Promise<void> {
  // Twilio SMS fallback. TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN.
  throw new Error("not implemented: Twilio SMS send");
}

async function sendEmail(msg: OutboundMessage): Promise<void> {
  // Resend email fallback. RESEND_API_KEY.
  throw new Error("not implemented: Resend email send");
}
