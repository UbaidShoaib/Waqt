import { getOwnedBusiness } from "@/lib/supabase/server";
import BookingActions from "@/components/dashboard/BookingActions";

// Owner dashboard (TRD Flow D): today/upcoming bookings, cancel/complete/
// mark-paid actions. Session-scoped queries — RLS applies.
export default async function DashboardPage() {
  const { business, supabase } = await getOwnedBusiness();
  if (!business) return null;

  const { data: rows } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, status, payment_status, source, services(name), customers(name, phone)"
    )
    .eq("business_id", business.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  // Supabase infers many-to-one joins as arrays without generated DB types;
  // PostgREST actually returns a single object for these FK relations.
  const bookings = (rows ?? []) as unknown as {
    id: string;
    starts_at: string;
    status: "confirmed" | "cancelled" | "completed" | "no_show";
    payment_status: "unpaid" | "paid";
    source: string;
    services: { name: string } | null;
    customers: { name: string; phone: string | null } | null;
  }[];

  return (
    <>
      <h2 className="text-lg font-medium">Upcoming bookings</h2>
      <ul className="divide-y rounded-lg border">
        {bookings.map((b) => (
          <li
            key={b.id}
            className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div>
                {new Date(b.starts_at).toLocaleString()} — {b.services?.name}
              </div>
              <div className="text-slate-500">
                {b.customers?.name} · {b.customers?.phone}
              </div>
              <div className="text-slate-500">
                {b.status} · {b.payment_status} · via {b.source}
              </div>
            </div>
            <BookingActions
              bookingId={b.id}
              status={b.status}
              paymentStatus={b.payment_status}
            />
          </li>
        ))}
        {bookings.length === 0 && (
          <li className="p-3 text-sm text-slate-500">No upcoming bookings.</li>
        )}
      </ul>
    </>
  );
}
