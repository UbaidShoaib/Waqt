import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createBusinessSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  timezone: z.string().min(1),
  currency: z.string().length(3),
});

// POST /api/businesses — create business for the authenticated user.
// owner_user_id comes from the session, never the body (TRD §9 Layer 2).
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createBusinessSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...parsed.data, owner_user_id: user.id })
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500; // slug taken
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}
