import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { frameAncestorsValue, hostFromHeader, isAllowedEmbedHost } from "@/lib/domains";

export const config = {
  matcher: ["/embed/:slug*", "/dashboard/:path*", "/onboarding", "/login"],
};

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/embed/")) {
    return embedMiddleware(req);
  }
  return authMiddleware(req);
}

// Embed access control (TRD §11):
//   2. Per-request CSP frame-ancestors built from the tenant whitelist —
//      never a wildcard. Browser-enforced.
//   3. Defense in depth: server-side Origin/Referer check. Mismatch →
//      x-waqt-embed-blocked header; the embed page renders a "not
//      authorized" placeholder instead of the booking form, and the
//      attempt is logged so the owner can spot a forgotten staging domain.
//   5. The owner's authenticated dashboard preview bypasses the check —
//      handled in the embed page itself (session check), never here for
//      anonymous requests.
async function embedMiddleware(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/")[2];
  if (!slug) return NextResponse.next();

  const allowed = await fetchAllowedDomains(slug);

  const res = NextResponse.next();
  res.headers.set(
    "Content-Security-Policy",
    `frame-ancestors ${frameAncestorsValue(allowed)}`
  );

  const referrerHost =
    hostFromHeader(req.headers.get("origin")) ??
    hostFromHeader(req.headers.get("referer"));

  if (!isAllowedEmbedHost(referrerHost, allowed)) {
    // Signal the page to render the "not authorized" placeholder.
    // (Owner-preview bypass is decided in the page, where the session lives.)
    res.headers.set("x-waqt-embed-blocked", "1");
    console.warn(
      `[embed-blocked] slug=${slug} host=${referrerHost ?? "none"}` // TODO: persist for owner visibility (TRD §11.3)
    );
  }
  return res;
}

// Edge-safe REST lookup (service-role key; middleware can't use the Node SDK).
// Queries ONLY the whitelist table, scoped by the business resolved from slug.
async function fetchAllowedDomains(slug: string): Promise<string[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const bizRes = await fetch(
    `${base}/rest/v1/businesses?slug=eq.${encodeURIComponent(slug)}&select=id`,
    { headers, next: { revalidate: 60 } }
  );
  const [biz] = (await bizRes.json()) as { id: string }[];
  if (!biz) return [];

  const domRes = await fetch(
    `${base}/rest/v1/business_allowed_domains?business_id=eq.${biz.id}&select=domain`,
    { headers, next: { revalidate: 60 } }
  );
  const rows = (await domRes.json()) as { domain: string }[];
  return rows.map((r) => r.domain);
}

// Refreshes the Supabase session cookie for dashboard/auth routes. Server
// Components can't write cookies mid-render (server.ts's setAll silently
// no-ops there) — this is the only place a near-expired session actually
// gets refreshed before getOwnedBusiness() reads it downstream.
async function authMiddleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: ((cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        }) satisfies SetAllCookies,
      },
    }
  );

  await supabase.auth.getUser();

  return res;
}
