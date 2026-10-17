import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, type Channel, type MessageType } from "@/lib/messaging/send";
import { buildMessage } from "@/lib/messaging/templates";

/**
 * Send one booking notification and record it in notifications_log.
 * Callers must already be authorized for this booking (public booking
 * creation, the owner's PATCH, or the cron). Never throws — a messaging
 * failure must not fail the booking action that triggered it.
 */
export async function notifyBooking(bookingId: string, type: MessageType): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("bookings")
      .select(
        "id, starts_at, services(name), customers(name, phone, email, preferred_channel, opted_out_at), businesses(name, slug, timezone)"
      )
      .eq("id", bookingId)
      .single();
    // Many-to-one joins come back as single objects from PostgREST.
    const booking = data as unknown as {
      id: string;
      starts_at: string;
      services: { name: string };
      customers: {
        name: string;
        phone: string | null;
        email: string | null;
        preferred_channel: Channel;
        opted_out_at: string | null;
      };
      businesses: { name: string; slug: string; timezone: string };
    } | null;
    if (!booking || booking.customers.opted_out_at) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://waqt.io";
    const { subject, body } = buildMessage(type, {
      businessName: booking.businesses.name,
      timezone: booking.businesses.timezone,
      serviceName: booking.services.name,
      customerName: booking.customers.name,
      startsAt: booking.starts_at,
      bookingUrl: `${appUrl}/b/${booking.businesses.slug}`,
    });

    const result = await sendMessage({
      bookingId,
      type,
      to: { phone: booking.customers.phone, email: booking.customers.email },
      preferredChannel: booking.customers.preferred_channel,
      subject,
      body,
    });

    await admin.from("notifications_log").insert({
      booking_id: bookingId,
      channel: result.channel,
      type,
      status: result.status,
      sent_at: result.status === "sent" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error(`[notify] booking=${bookingId} type=${type}`, err);
  }
}
