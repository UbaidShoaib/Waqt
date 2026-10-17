import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getPublicBusinessBySlug } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { createBookingSchema, CONSENT_TEXT_VERSION } from "@/lib/validation/booking";
import { getOpenSlots } from "@/lib/availability";
import { notifyBooking } from "@/lib/messaging/notify";
import { formatDateInTimezone } from "@/lib/dates";

// POST /api/public/:slug/bookings — anonymous booking creation.
// PUBLIC ROUTE (TRD §9 Layer 3): rate-limited, slug-scoped, records source.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`book:${ip}:${params.slug}`).ok) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = createBookingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  if (!input.customer.phone && !input.customer.email) {
    return NextResponse.json({ error: "phone or email required" }, { status: 400 });
  }
  if (input.customer.phone && !input.customer.messaging_consent) {
    return NextResponse.json({ error: "messaging consent required" }, { status: 400 });
  }

  const result = await getPublicBusinessBySlug(params.slug);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { business } = result;

  const service = result.services.find(
    (s: { id: string }) => s.id === input.service_id
  );
  if (!service) return NextResponse.json({ error: "unknown service" }, { status: 404 });

  const startsAt = new Date(input.starts_at);
  const endsAt = new Date(startsAt.getTime() + service.duration_min * 60_000);
  if (startsAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "slot is in the past" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Only accept a start time the slots endpoint would actually offer —
  // otherwise a direct API call could book outside opening hours.
  const localDate = formatDateInTimezone(startsAt, business.timezone);
  const open = await getOpenSlots(admin, {
    businessId: business.id,
    timezone: business.timezone,
    durationMin: service.duration_min,
    date: localDate,
  });
  if (!open.some((s) => s.starts_at === startsAt.toISOString())) {
    return NextResponse.json({ error: "slot unavailable" }, { status: 409 });
  }

  // Upsert customer within this tenant only.
  const { data: customer, error: custError } = await admin
    .from("customers")
    .insert({
      business_id: business.id,
      name: input.customer.name,
      phone: input.customer.phone ?? null,
      email: input.customer.email ?? null,
      preferred_channel: input.customer.preferred_channel,
      messaging_consent_at: input.customer.messaging_consent ? new Date().toISOString() : null,
      consent_text_version: input.customer.messaging_consent ? CONSENT_TEXT_VERSION : null,
    })
    .select()
    .single();
  if (custError) {
    return NextResponse.json({ error: "could not save customer" }, { status: 500 });
  }

  const { data: booking, error: bookError } = await admin
    .from("bookings")
    .insert({
      business_id: business.id,
      service_id: service.id,
      customer_id: customer.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      source: input.source,
    })
    .select("id, starts_at, ends_at, status, source")
    .single();

  if (bookError) {
    // 23P01 = exclusion violation (overlapping booking committed concurrently).
    // The orphan customer row is removed so failed attempts don't accumulate PII.
    await admin.from("customers").delete().eq("id", customer.id);
    const status = bookError.code === "23P01" ? 409 : 500;
    return NextResponse.json({ error: "slot unavailable" }, { status });
  }

  await notifyBooking(booking.id, "confirmation");

  return NextResponse.json(booking, { status: 201 });
}
