// Browser-side Supabase client for client components (login/logout forms).
// Manages its own cookies, kept in sync with what server.ts's
// createServerClient reads on the next request.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
