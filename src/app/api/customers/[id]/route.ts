import { NextRequest, NextResponse } from "next/server";
import { getOwnedBusiness } from "@/lib/supabase/server";

// DELETE /api/customers/:id — right to erasure. Removes the customer and,
// via FK cascade (0003), their bookings and notification log rows.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "no business" }, { status: 404 });

  const { data, error } = await supabase
    .from("customers")
    .delete()
    .eq("id", params.id)
    .eq("business_id", business.id) // explicit, on top of RLS
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
