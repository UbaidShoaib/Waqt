import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBooking } from "@/lib/messaging/notify";

// GET /api/jobs/send-reminders — Vercel Cron only (TRD §12).
// Gated by CRON_SECRET so an arbitrary caller can't impersonate the
// scheduler (TRD §9, "Secrets as the last line of defense").
// Vercel Cron invokes with GET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();

  // Find confirmed bookings entering a reminder window (24h / 1h) that don't
  // already have a sent log row for that reminder type.
  const windows = [
    { type: "reminder_24h" as const, msBefore: 24 * 60 * 60_000 },
    { type: "reminder_1h" as const, msBefore: 60 * 60_000 },
  ];

  let sent = 0;
  for (const w of windows) {
    const windowStart = new Date(now + w.msBefore - 15 * 60_000).toISOString();
    const windowEnd = new Date(now + w.msBefore).toISOString();

    const { data: due } = await admin
      .from("bookings")
      .select("id, starts_at, business_id, customers!inner(name, phone, email, preferred_channel, opted_out_at)")
      .eq("status", "confirmed")
      .is("customers.opted_out_at", null)
      .gte("starts_at", windowStart)
      .lte("starts_at", windowEnd);

    for (const booking of due ?? []) {
      const { data: already } = await admin
        .from("notifications_log")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("type", w.type)
        .eq("status", "sent")
        .limit(1);
      if (already && already.length > 0) continue;

      await notifyBooking(booking.id, w.type);
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
