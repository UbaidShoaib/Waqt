import Link from "next/link";
import { getOwnedBusiness } from "@/lib/supabase/server";
import BookingActions from "@/components/dashboard/BookingActions";
import { formatDateInTimezone, formatDateLabel, formatSlotLabel } from "@/lib/dates";

type Status = "confirmed" | "cancelled" | "completed" | "no_show";

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-success-soft text-success" },
  cancelled: { label: "Cancelled", className: "bg-danger-soft text-danger" },
  completed: { label: "Completed", className: "bg-line-soft text-ink" },
  no_show: { label: "No-show", className: "bg-notice-soft text-notice" },
};

// Owner dashboard (TRD Flow D): upcoming bookings grouped by the business's
// local day, plus a setup checklist until the booking page is usable.
// Session-scoped queries — RLS applies.
export default async function DashboardPage() {
  const { business, supabase } = await getOwnedBusiness();
  if (!business) return null;

  const [{ data: rows }, { count: serviceCount }, { count: ruleCount }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, customer_id, starts_at, status, payment_status, source, services(name), customers(name, phone, email)"
      )
      .eq("business_id", business.id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(50),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("availability_rules").select("id", { count: "exact", head: true }).eq("business_id", business.id),
  ]);

  // Supabase infers many-to-one joins as arrays without generated DB types;
  // PostgREST actually returns a single object for these FK relations.
  const bookings = (rows ?? []) as unknown as {
    id: string;
    customer_id: string;
    starts_at: string;
    status: Status;
    payment_status: "unpaid" | "paid";
    source: string;
    services: { name: string } | null;
    customers: { name: string; phone: string | null; email: string | null } | null;
  }[];

  const tz = business.timezone;
  const today = formatDateInTimezone(new Date(), tz);
  const tomorrow = formatDateInTimezone(new Date(Date.now() + 86_400_000), tz);
  const days = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const day = formatDateInTimezone(new Date(b.starts_at), tz);
    days.set(day, [...(days.get(day) ?? []), b]);
  }
  const dayTitle = (d: string) => (d === today ? "Today" : d === tomorrow ? "Tomorrow" : formatDateLabel(d, tz));

  const setup = [
    { done: (serviceCount ?? 0) > 0, label: "Add a service", href: "/dashboard/services" },
    { done: (ruleCount ?? 0) > 0, label: "Set your opening hours", href: "/dashboard/availability" },
    { done: Boolean(business.brand_color || business.logo_url), label: "Add your logo and colour", href: "/dashboard/branding" },
  ];
  const setupLeft = setup.filter((s) => !s.done).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-3xl font-semibold">Upcoming</h2>
        <p className="text-sm text-ink-muted">
          {bookings.length} booking{bookings.length === 1 ? "" : "s"}
        </p>
      </div>

      {setupLeft > 0 && (
        <section className="space-y-3 rounded-card border border-line bg-paper-raised p-5 shadow-lift">
          <div>
            <h3 className="font-display text-lg font-semibold">Get your booking page ready</h3>
            <p className="text-sm text-ink-muted">
              {setupLeft} step{setupLeft === 1 ? "" : "s"} left before customers can book.
            </p>
          </div>
          <ol className="space-y-2">
            {setup.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex min-h-11 items-center gap-3 rounded-card px-2 text-sm hover:bg-paper"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      s.done ? "bg-success text-paper" : "border-2 border-line"
                    }`}
                  >
                    {s.done ? "✓" : ""}
                  </span>
                  <span className={s.done ? "text-ink-muted line-through" : "font-semibold"}>{s.label}</span>
                  <span className="sr-only">{s.done ? "(done)" : "(to do)"}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {bookings.length === 0 && (
        <div className="rounded-card border border-dashed border-line p-10 text-center">
          <p className="font-display text-xl font-semibold">No upcoming bookings</p>
          <p className="mt-1 text-sm text-ink-muted">
            Share{" "}
            <a href={`/b/${business.slug}`} className="font-semibold text-ink underline underline-offset-4">
              your booking page
            </a>{" "}
            to get your first one.
          </p>
        </div>
      )}

      {Array.from(days.entries()).map(([day, list]) => (
        <section key={day} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{dayTitle(day)}</h3>
          <ul className="space-y-2">
            {list.map((b) => {
              const badge = STATUS_BADGE[b.status];
              const contact = b.customers?.phone ?? b.customers?.email;
              return (
                <li
                  key={b.id}
                  className="flex flex-col gap-3 rounded-card border border-line bg-paper-raised p-4 sm:flex-row sm:items-start"
                >
                  <p className="w-28 shrink-0 whitespace-nowrap font-display text-xl font-semibold">{formatSlotLabel(b.starts_at, tz)}</p>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{b.customers?.name}</span>
                      <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                      {b.payment_status === "paid" && (
                        <span className="rounded-pill bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-fg">Paid</span>
                      )}
                    </div>
                    <p className="text-sm text-ink-muted">
                      {b.services?.name}
                      {contact && <> · {contact}</>} · {b.source === "widget" ? "Website widget" : "Booking link"}
                    </p>
                    <div className="pt-2">
                      <BookingActions
                        bookingId={b.id}
                        status={b.status}
                        paymentStatus={b.payment_status}
                        customerId={b.customer_id}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
