import type { PublicBusiness, PublicService } from "@/components/BookingFlow";
import SectionTitle from "@/components/ui/SectionTitle";
import { formatMoney } from "@/lib/money";

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

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
    <section className="space-y-2.5">
      <SectionTitle step={1}>Service</SectionTitle>
      {services.length === 0 && (
        <p className="text-sm text-ink-muted">No services are bookable online yet.</p>
      )}
      {services.map((s) => {
        const selected = selectedId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(s.id)}
            className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-card bg-paper-raised px-4 py-3 text-left transition ${
              selected ? "border-2 border-ink" : "border border-line hover:border-ink-muted"
            }`}
          >
            <span className="flex flex-col gap-0.5">
              <span className={`text-[15px] ${selected ? "font-bold" : "font-semibold"}`}>{s.name}</span>
              <span className="text-[13px] text-ink-muted">{formatDuration(s.duration_min)}</span>
            </span>
            <span className={selected ? "font-bold" : "font-semibold"}>
              {s.price_cents > 0 ? formatMoney(s.price_cents, business.currency) : "Free"}
            </span>
          </button>
        );
      })}
    </section>
  );
}
