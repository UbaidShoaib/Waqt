"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface DayRow {
  open: boolean;
  start: string;
  end: string;
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toHHMM(time: string): string {
  return time.slice(0, 5);
}

function buildInitialDays(rules: Rule[]): DayRow[] {
  return Array.from({ length: 7 }, (_, day) => {
    const rule = rules.find((r) => r.day_of_week === day);
    return rule
      ? { open: true, start: toHHMM(rule.start_time), end: toHHMM(rule.end_time) }
      : { open: false, start: "09:00", end: "17:00" };
  });
}

export default function AvailabilityForm({ initialRules }: { initialRules: Rule[] }) {
  const router = useRouter();
  const [days, setDays] = useState<DayRow[]>(() => buildInitialDays(initialRules));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateDay(index: number, patch: Partial<DayRow>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const openDays = days
      .map((d, i) => ({ ...d, day_of_week: i }))
      .filter((d) => d.open);

    const invalid = openDays.find((d) => d.start >= d.end);
    if (invalid) {
      setError(
        `${DAY_LABELS[invalid.day_of_week]}: end time must be after start time.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: openDays.map((d) => ({
            day_of_week: d.day_of_week,
            start_time: d.start,
            end_time: d.end,
          })),
        }),
      });

      if (res.status === 201) {
        setSaved(true);
        router.refresh();
        setLoading(false);
        return;
      }

      setError("Something went wrong — try again.");
      setLoading(false);
    } catch {
      setError("Something went wrong — try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-muted">
        Saving replaces your entire weekly schedule.
      </p>
      <div className="space-y-2">
        {days.map((day, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <label className="flex w-32 items-center gap-2">
              <input
                type="checkbox"
                checked={day.open}
                onChange={(e) => updateDay(i, { open: e.target.checked })}
              />
              {DAY_LABELS[i]}
            </label>
            <input
              type="time"
              value={day.start}
              disabled={!day.open}
              onChange={(e) => updateDay(i, { start: e.target.value })}
              className="min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
            <span className="text-ink-muted">to</span>
            <input
              type="time"
              value={day.end}
              disabled={!day.open}
              onChange={(e) => updateDay(i, { end: e.target.value })}
              className="min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Saved.</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center rounded-pill bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save schedule"}
      </button>
    </form>
  );
}
