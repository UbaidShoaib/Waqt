import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/jobs/send-reminders — Vercel Cron only (TRD §12).
// Gated by CRON_SECRET so an arbitrary caller can't impersonate the
// scheduler (TRD §9, "Secrets as the last line of defense").
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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

  let queued = 0;
  for (const w of windows) {
    const windowStart = new Date(now + w.msBefore - 15 * 60_000).toISOString();
    const windowEnd = new Date(now + w.msBefore).toISOString();

    const { data: due } = await admin
      .from("bookings")
      .select("id, starts_at, business_id, customers(name, phone, email, preferred_channel)")
      .eq("status", "confirmed")
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

      // TODO Week 3: build message body in the business's timezone and send
      // via lib/messaging/send.ts; write result to notifications_log with
      // one retry on failure (TRD §12).
      queued += 1;
    }
  }

  return NextResponse.json({ ok: true, queued });
}
