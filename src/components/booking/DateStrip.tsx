"use client";

import { useState } from "react";
import { formatDateLabel } from "@/lib/dates";

const WINDOW_SIZE = 7;

export default function DateStrip({
  timezone,
  dateOptions,
  selectedDate,
  onSelect,
}: {
  timezone: string;
  dateOptions: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const [windowStart, setWindowStart] = useState(0);

  if (dateOptions.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-slate-500">Choose a date</h2>
        <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
      </section>
    );
  }

  const visible = dateOptions.slice(windowStart, windowStart + WINDOW_SIZE);
  const canGoBack = windowStart > 0;
  const canGoForward = windowStart + WINDOW_SIZE < dateOptions.length;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-slate-500">Choose a date</h2>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Earlier dates"
          disabled={!canGoBack}
          onClick={() => setWindowStart((w) => Math.max(0, w - WINDOW_SIZE))}
          className="rounded-md border border-slate-200 px-2 py-3 text-slate-500 disabled:opacity-30"
        >
          ‹
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {visible.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={`rounded-lg border p-2 text-center text-xs transition ${
                selectedDate === date
                  ? "border-brand ring-1 ring-brand"
                  : "border-slate-200"
              }`}
            >
              {formatDateLabel(date, timezone)}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Later dates"
          disabled={!canGoForward}
          onClick={() =>
            setWindowStart((w) => Math.min(dateOptions.length - WINDOW_SIZE, w + WINDOW_SIZE))
          }
          className="rounded-md border border-slate-200 px-2 py-3 text-slate-500 disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </section>
  );
}
