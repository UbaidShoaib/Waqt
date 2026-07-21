import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/supabase/server";

// Owner dashboard (TRD Flow D): today/upcoming bookings, cancel/complete/
// mark-paid actions. Session-scoped queries — RLS applies.
export default async function DashboardPage() {
  const { user, business, supabase } = await getOwnedBusiness();
  if (!user) redirect("/login");
  if (!business) redirect("/onboarding");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, status, payment_status, source, services(name), customers(name, phone)"
    )
    .eq("business_id", business.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">{business.name} — upcoming</h1>
      <ul className="divide-y rounded-lg border">
        {(bookings ?? []).map((b) => (
          <li key={b.id} className="flex items-center justify-between p-3 text-sm">
            <span>{new Date(b.starts_at).toLocaleString()}</span>
            <span className="text-slate-500">
              {b.status} · {b.payment_status} · via {b.source}
            </span>
          </li>
        ))}
        {(bookings ?? []).length === 0 && (
          <li className="p-3 text-sm text-slate-500">No upcoming bookings.</li>
        )}
      </ul>
      {/* TODO Week 2: cancel / complete / mark-paid actions → PATCH /api/bookings/:id */}
    </main>
  );
}
