import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedBusiness } from "@/lib/supabase/server";

const rulesSchema = z.object({
  rules: z
    .array(
      z.object({
        day_of_week: z.number().int().min(0).max(6),
        start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
        end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      })
    )
    .max(50),
});

// POST /api/availability — replace-all semantics for weekly rules (TRD §8).
export async function POST(req: NextRequest) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business) return NextResponse.json({ error: "no business" }, { status: 404 });

  const parsed = rulesSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error: delError } = await supabase
    .from("availability_rules")
    .delete()
    .eq("business_id", business.id);
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("availability_rules")
    .insert(
      parsed.data.rules.map((r) => ({ ...r, business_id: business.id }))
    )
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
