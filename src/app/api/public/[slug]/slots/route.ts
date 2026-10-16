import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getPublicBusinessBySlug } from "@/lib/supabase/admin";
import { getOpenSlots } from "@/lib/availability";

// GET /api/public/:slug/slots?service_id=&date=YYYY-MM-DD
// PUBLIC ROUTE (TRD §9 Layer 3): every query below filters by the
// business_id resolved from the slug.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const serviceId = req.nextUrl.searchParams.get("service_id");
  const date = req.nextUrl.searchParams.get("date");
  if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "service_id and date required" }, { status: 400 });
  }

  const result = await getPublicBusinessBySlug(params.slug);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { business } = result;

  const service = result.services.find((s: { id: string }) => s.id === serviceId);
  if (!service) return NextResponse.json({ error: "unknown service" }, { status: 404 });

  const slots = await getOpenSlots(createAdminClient(), {
    businessId: business.id,
    timezone: business.timezone,
    durationMin: service.duration_min,
    date,
  });

  return NextResponse.json({ slots });
}
