import { NextRequest, NextResponse } from "next/server";
import { getOwnedBusiness } from "@/lib/supabase/server";

// DELETE /api/businesses/:id/allowed-domains/:domainId (TRD §8).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; domainId: string } }
) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business || business.id !== params.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("business_allowed_domains")
    .delete()
    .eq("id", params.domainId)
    .eq("business_id", business.id); // belt-and-braces on top of RLS

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
