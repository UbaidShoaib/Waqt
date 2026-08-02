import { getOwnedBusiness } from "@/lib/supabase/server";
import AddDomainForm from "@/components/dashboard/AddDomainForm";
import DomainRowActions from "@/components/dashboard/DomainRowActions";

// Embed-code generator (TRD Flow E). Snippet is inert until at least one
// domain is whitelisted (TRD §19 confirmed default).
export default async function EmbedSettingsPage() {
  const { business, supabase } = await getOwnedBusiness();
  if (!business) return null;

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
    <>
      <h2 className="text-lg font-medium">Embed your booking widget</h2>

      <section className="space-y-2">
        <h2 className="font-medium">1. Allowed domains</h2>
        <p className="text-sm text-slate-600">
          The widget only renders on domains you list here. Add www and the
          bare domain separately.
        </p>
        <ul className="divide-y rounded-lg border">
          {(domains ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between p-3 text-sm">
              <span>{d.domain}</span>
              <DomainRowActions businessId={business.id} domainId={d.id} />
            </li>
          ))}
        </ul>
        {(domains ?? []).length === 0 && (
          <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">
            No domains yet — your embed snippet is inactive until you add one.
          </p>
        )}
        <AddDomainForm businessId={business.id} />
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">2. Copy this snippet into your site</h2>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          {snippet}
        </pre>
      </section>
    </>
  );
}
