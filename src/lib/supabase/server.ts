// Session-scoped Supabase client for authenticated (owner) routes.
// Queries run as the logged-in user → RLS applies (TRD §9 Layer 1).
import { cache } from "react";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: ((cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware refreshes sessions.
          }
        }) satisfies SetAllCookies,
      },
    }
  );
}

/**
 * Resolve the authenticated owner's business. TRD §9 Layer 2 hard rule:
 * business_id is derived from the session, NEVER read from client input.
 * Every authenticated route must use this instead of trusting the request.
 */
export const getOwnedBusiness = cache(async function getOwnedBusiness() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, business: null, supabase };

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  return { user, business, supabase };
});
