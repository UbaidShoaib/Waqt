"use client";

import { useState } from "react";
import { formatDateParts } from "@/lib/dates";
import SectionTitle from "@/components/ui/SectionTitle";

const WINDOW_SIZE = 7;

const arrowBtn =
  "flex h-16 w-8 shrink-0 items-center justify-center rounded-card text-ink-muted transition hover:text-ink disabled:opacity-30";

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
      <section className="space-y-2.5">
        <SectionTitle step={2}>Day</SectionTitle>
        <div className="h-16 animate-pulse rounded-card bg-line-soft" />
      </section>
    );
  }

  const visible = dateOptions.slice(windowStart, windowStart + WINDOW_SIZE);
  const canGoBack = windowStart > 0;
  const canGoForward = windowStart + WINDOW_SIZE < dateOptions.length;
  const month = formatDateParts(visible[0], timezone).month;

  return (
    <section className="animate-rise space-y-2.5">
      <div className="flex items-baseline justify-between">
        <SectionTitle step={2}>Day</SectionTitle>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{month}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Earlier dates"
          disabled={!canGoBack}
          onClick={() => setWindowStart((w) => Math.max(0, w - WINDOW_SIZE))}
          className={arrowBtn}
        >
          <Chevron dir="left" />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1.5">
          {visible.map((date) => {
            const { weekday, day } = formatDateParts(date, timezone);
            const selected = selectedDate === date;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selected}
                aria-label={`${weekday} ${day}`}
                onClick={() => onSelect(date)}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 rounded-card transition ${
                  selected
                    ? "bg-ink text-paper"
                    : "border border-line bg-paper-raised hover:border-ink-muted"
                }`}
              >
                <span className={`text-[11px] uppercase tracking-[0.08em] ${selected ? "" : "text-ink-muted"}`}>
                  {weekday}
                </span>
                <span className="font-display text-xl font-semibold">{day}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Later dates"
          disabled={!canGoForward}
          onClick={() =>
            setWindowStart((w) => Math.min(dateOptions.length - WINDOW_SIZE, w + WINDOW_SIZE))
          }
          className={arrowBtn}
        >
          <Chevron dir="right" />
        </button>
      </div>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}
