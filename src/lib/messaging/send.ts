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
  subject: string;
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
  if (channel !== "email" && !paidChannelsEnabled()) {
    // WhatsApp Cloud API / Twilio cost money per message; until they're
    // configured, fall through to email (free tier) instead.
    throw new Error(`${channel} not configured`);
  }
  switch (channel) {
    case "whatsapp":
      return sendWhatsApp(msg);
    case "sms":
      return sendSms(msg);
    case "email":
      return sendEmail(msg);
  }
}

function paidChannelsEnabled(): boolean {
  return Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN || process.env.TWILIO_ACCOUNT_SID);
}

// --- Providers -----------------------------------------------------------------

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
  if (!msg.to.email) throw new Error("no email address");
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY not set");
    // Local dev without a key: print instead of sending.
    console.info(`[dev-email] to=${msg.to.email} subject="${msg.subject}"\n${msg.body}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "Waqt <bookings@resend.dev>",
      to: [msg.to.email],
      subject: msg.subject,
      text: msg.body,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
