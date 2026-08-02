import type { Slot } from "@/lib/slots";
import { formatSlotLabel } from "@/lib/dates";

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
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-slate-500">Choose a time</h2>

      {status === "loading" && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          Couldn&apos;t load available times.{" "}
          <button type="button" onClick={onRetry} className="underline">
            Try again
          </button>
        </div>
      )}

      {status === "loaded" && slots.length === 0 && (
        <p className="text-sm text-slate-500">
          No times available on this date — try another day.
        </p>
      )}

      {status === "loaded" && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.starts_at}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-lg border p-2 text-center text-sm transition ${
                selectedSlot?.starts_at === slot.starts_at
                  ? "border-brand ring-1 ring-brand"
                  : "border-slate-200"
              }`}
            >
              {formatSlotLabel(slot.starts_at, timezone)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
