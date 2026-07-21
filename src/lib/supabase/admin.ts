import "server-only";
// ^ build fails if this file is ever imported into client code.

// Service-role client. BYPASSES ALL RLS (TRD §9). Narrow, deliberate
// exception for routes with no authenticated user:
//   - /api/public/:slug*  (slug-scoped reads + booking creation)
//   - /embed/:slug        (public booking page in iframe)
//   - /api/jobs/*         (cron, gated by CRON_SECRET)
//   - /api/webhooks/*     (signature-verified provider callbacks)
//
// Rules when using this client:
//   1. Every query MUST explicitly filter by the business_id resolved
//      from the slug — RLS is not protecting you here.
//   2. Responses limited to an explicit allowlist of public fields
//      (see PUBLIC_BUSINESS_FIELDS below). Never booking history, other
//      customers' data, or internal fields.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// The ONLY business fields public routes may return (TRD §9 Layer 3).
export const PUBLIC_BUSINESS_FIELDS =
  "id, name, slug, timezone, currency, logo_url, brand_color, welcome_message";

export const PUBLIC_SERVICE_FIELDS =
  "id, name, duration_min, price_cents";

/** Resolve a business by slug for public routes. Returns public fields only. */
export async function getPublicBusinessBySlug(slug: string) {
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select(PUBLIC_BUSINESS_FIELDS)
    .eq("slug", slug)
    .single();
  if (!business) return null;

  const { data: services } = await admin
    .from("services")
    .select(PUBLIC_SERVICE_FIELDS)
    .eq("business_id", business.id)
    .eq("is_active", true);

  return { business, services: services ?? [] };
}
