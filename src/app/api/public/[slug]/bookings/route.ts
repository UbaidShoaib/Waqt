import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, getPublicBusinessBySlug } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const createBookingSchema = z.object({
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  customer: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().max(32).optional(),
    email: z.string().email().optional(),
    preferred_channel: z.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
  }),
  source: z.enum(["direct_link", "widget"]).default("direct_link"),
});

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

  // Upsert customer within this tenant only.
  const { data: customer, error: custError } = await admin
    .from("customers")
    .insert({
      business_id: business.id,
      name: input.customer.name,
      phone: input.customer.phone ?? null,
      email: input.customer.email ?? null,
      preferred_channel: input.customer.preferred_channel,
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
    const status = bookError.code === "23505" ? 409 : 500; // slot just taken
    return NextResponse.json({ error: "slot unavailable" }, { status });
  }

  // TODO Week 3: send confirmation via lib/messaging/send.ts + log it.

  return NextResponse.json(booking, { status: 201 });
}
