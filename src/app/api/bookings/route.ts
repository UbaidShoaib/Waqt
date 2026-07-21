import { NextRequest, NextResponse } from "next/server";
import { getOwnedBusiness } from "@/lib/supabase/server";

// GET /api/bookings — owner lists own-tenant bookings only.
// RLS enforces tenant scope even without the explicit filter (defense in depth).
export async function GET(req: NextRequest) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "no business" }, { status: 404 });

  const from = req.nextUrl.searchParams.get("from");

  let query = supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, payment_status, source, services(name), customers(name, phone, email)"
    )
    .eq("business_id", business.id)
    .order("starts_at");

  if (from) query = query.gte("starts_at", from);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
