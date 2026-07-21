import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedBusiness } from "@/lib/supabase/server";
import { normalizeDomain } from "@/lib/domains";

// GET/POST /api/businesses/:id/allowed-domains — widget embed whitelist
// (TRD §11). Embed snippet is inert until at least one domain exists.

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business || business.id !== params.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("business_allowed_domains")
    .select("id, domain, created_at")
    .eq("business_id", business.id)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const addDomainSchema = z.object({ domain: z.string().min(3).max(255) });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!business || business.id !== params.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = addDomainSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const normalized = normalizeDomain(parsed.data.domain);
  if (!normalized) {
    return NextResponse.json({ error: "invalid domain" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("business_allowed_domains")
    .insert({ business_id: business.id, domain: normalized })
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}
