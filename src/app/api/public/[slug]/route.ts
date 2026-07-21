import { NextResponse } from "next/server";
import { getPublicBusinessBySlug } from "@/lib/supabase/admin";

// GET /api/public/:slug — business + active services + branding.
// PUBLIC ROUTE (TRD §9 Layer 3): service-role client, slug-scoped query,
// explicit field allowlist. Never returns bookings, customers, or
// allowed-domain internals.
export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const result = await getPublicBusinessBySlug(params.slug);
  if (!result) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
