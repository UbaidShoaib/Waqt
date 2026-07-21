import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedBusiness } from "@/lib/supabase/server";

const updateServiceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  duration_min: z.number().int().positive().max(24 * 60).optional(),
  price_cents: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

// PATCH /api/services/:id — update/deactivate. Scoped to session tenant.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "no business" }, { status: 404 });

  const parsed = updateServiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("services")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("business_id", business.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
