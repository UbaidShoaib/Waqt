import { getOwnedBusiness } from "@/lib/supabase/server";
import AddServiceForm from "@/components/dashboard/AddServiceForm";
import ServiceRow from "@/components/dashboard/ServiceRow";

export default async function ServicesPage() {
  const { business, supabase } = await getOwnedBusiness();
  if (!business) return null;

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_min, price_cents, is_active")
    .eq("business_id", business.id)
    .order("created_at");

  return (
    <>
      <h2 className="font-display text-2xl font-semibold">Services</h2>
      <AddServiceForm currency={business.currency} />
      <ul className="divide-y divide-line-soft rounded-card border border-line bg-paper-raised">
        {(services ?? []).map((s) => (
          <li key={s.id} className="p-3 text-sm">
            <ServiceRow service={s} currency={business.currency} />
          </li>
        ))}
        {(services ?? []).length === 0 && (
          <li className="p-3 text-sm text-ink-muted">No services yet.</li>
        )}
      </ul>
    </>
  );
}
