import type { Slot } from "@/lib/slots";
import { dayPeriod, formatSlotLabel, type DayPeriod } from "@/lib/dates";
import SectionTitle from "@/components/ui/SectionTitle";
import Notice from "@/components/ui/Notice";

const PERIODS: DayPeriod[] = ["Morning", "Afternoon", "Evening"];

export default function SlotGrid({
  slots,
  status,
  timezone,
  selectedSlot,
  onSelect,
  onRetry,
}: {
  slots: Slot[];
  status: "idle" | "loading" | "loaded" | "error";
  timezone: string;
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  onRetry: () => void;
}) {
  const grouped = PERIODS.map((period) => ({
    period,
    slots: slots.filter((s) => dayPeriod(s.starts_at, timezone) === period),
  })).filter((g) => g.slots.length > 0);

  return (
    <section className="animate-rise space-y-2.5">
      <SectionTitle step={3}>Time</SectionTitle>

      {status === "loading" && (
        <div className="grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading times">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-line-soft" />
          ))}
        </div>
      )}

      {status === "error" && (
        <Notice tone="danger">
          Couldn&apos;t load available times.{" "}
          <button type="button" onClick={onRetry} className="font-semibold underline">
            Try again
          </button>
        </Notice>
      )}

      {status === "loaded" && slots.length === 0 && (
        <p className="rounded-card border border-dashed border-line p-4 text-center text-sm text-ink-muted">
          Fully booked on this day — try another.
        </p>
      )}

      {status === "loaded" &&
        grouped.map((g) => (
          <div key={g.period} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">{g.period}</h3>
            <div className="grid grid-cols-3 gap-2">
              {g.slots.map((slot) => {
                const selected = selectedSlot?.starts_at === slot.starts_at;
                return (
                  <button
                    key={slot.starts_at}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelect(slot)}
                    className={`min-h-11 rounded-xl text-center text-sm transition ${
                      selected
                        ? "bg-brand font-bold text-brand-fg"
                        : "border border-line bg-paper-raised font-semibold hover:border-ink-muted"
                    }`}
                  >
                    {formatSlotLabel(slot.starts_at, timezone)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </section>
  );
}
