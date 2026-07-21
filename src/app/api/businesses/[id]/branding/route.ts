import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedBusiness } from "@/lib/supabase/server";

const brandingSchema = z.object({
  logo_url: z.string().url().nullable().optional(),
  brand_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  welcome_message: z.string().max(280).nullable().optional(),
});

// PATCH /api/businesses/:id/branding (TRD §10).
// The :id in the URL is validated against the session-owned business —
// we never act on a client-supplied id that isn't ours (TRD §9 Layer 2).
// RLS would block a cross-tenant write anyway (Layer 1); this check makes
// the failure explicit instead of silent.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business || business.id !== params.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = brandingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(parsed.data)
    .eq("id", business.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
