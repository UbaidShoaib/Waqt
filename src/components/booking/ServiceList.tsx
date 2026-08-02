import type { PublicBusiness, PublicService } from "@/components/BookingFlow";

export default function ServiceList({
  services,
  business,
  selectedId,
  onSelect,
}: {
  services: PublicService[];
  business: PublicBusiness;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-slate-500">Choose a service</h2>
      {services.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`w-full rounded-lg border p-3 text-left transition ${
            selectedId === s.id ? "border-brand ring-1 ring-brand" : "border-slate-200"
          }`}
        >
          <span className="font-medium">{s.name}</span>
          <span className="ml-2 text-sm text-slate-500">
            {s.duration_min} min ·{" "}
            {(s.price_cents / 100).toLocaleString(undefined, {
              style: "currency",
              currency: business.currency,
            })}
          </span>
        </button>
      ))}
    </section>
  );
}
