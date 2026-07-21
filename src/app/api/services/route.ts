import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedBusiness } from "@/lib/supabase/server";

const createServiceSchema = z.object({
  name: z.string().min(1).max(120),
  duration_min: z.number().int().positive().max(24 * 60),
  price_cents: z.number().int().min(0),
});

// POST /api/services — business_id derived from session, NOT the body
// (TRD §9 Layer 2 hard rule).
export async function POST(req: NextRequest) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "no business" }, { status: 404 });

  const parsed = createServiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("services")
    .insert({ ...parsed.data, business_id: business.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
