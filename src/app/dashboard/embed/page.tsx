import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/supabase/server";

// Embed-code generator (TRD Flow E). Snippet is inert until at least one
// domain is whitelisted (TRD §19 confirmed default).
export default async function EmbedSettingsPage() {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) redirect("/login");
  if (!business) redirect("/onboarding");

  const { data: domains } = await supabase
    .from("business_allowed_domains")
    .select("id, domain")
    .eq("business_id", business.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://waqt.io";
  const snippet = [
    `<div id="waqt-widget" data-business="${business.slug}"></div>`,
    `<script src="${appUrl}/widget.js" async></script>`,
  ].join("\n");

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Embed your booking widget</h1>

      <section className="space-y-2">
        <h2 className="font-medium">1. Allowed domains</h2>
        <p className="text-sm text-slate-600">
          The widget only renders on domains you list here. Add www and the
          bare domain separately.
        </p>
        <ul className="text-sm">
          {(domains ?? []).map((d) => (
            <li key={d.id}>{d.domain}</li>
          ))}
        </ul>
        {(domains ?? []).length === 0 && (
          <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">
            No domains yet — your embed snippet is inactive until you add one.
          </p>
        )}
        {/* TODO Week 4: add/remove domain form → /api/businesses/:id/allowed-domains */}
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">2. Copy this snippet into your site</h2>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          {snippet}
        </pre>
      </section>
    </main>
  );
}
