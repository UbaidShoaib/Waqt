"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dollarsToCents } from "@/lib/money";

export default function AddServiceForm({ currency }: { currency: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const duration = Number(durationMin);
    const price = Number(priceDollars);
    const fieldErrors: Record<string, string> = {};
    if (!name.trim()) fieldErrors.name = "Required.";
    if (!Number.isFinite(duration) || duration <= 0) {
      fieldErrors.duration_min = "Enter a positive number of minutes.";
    }
    if (!Number.isFinite(price) || price < 0) {
      fieldErrors.price_cents = "Enter a non-negative price.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          duration_min: duration,
          price_cents: dollarsToCents(price),
        }),
      });

      if (res.status === 201) {
        setName("");
        setDurationMin("");
        setPriceDollars("");
        router.refresh();
        setLoading(false);
        return;
      }

      if (res.status === 400) {
        const body = await res.json();
        const apiFieldErrors = body.error?.fieldErrors ?? {};
        const mapped: Record<string, string> = {};
        for (const field of ["name", "duration_min", "price_cents"]) {
          if (apiFieldErrors[field]?.[0]) mapped[field] = apiFieldErrors[field][0];
        }
        setErrors(
          Object.keys(mapped).length > 0
            ? mapped
            : { general: "Please check your details and try again." }
        );
        setLoading(false);
        return;
      }

      setErrors({ general: "Something went wrong — try again." });
      setLoading(false);
    } catch {
      setErrors({ general: "Something went wrong — try again." });
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink">Duration (min)</label>
        <input
          type="number"
          value={durationMin}
          onChange={(e) => setDurationMin(e.target.value)}
          className="w-24 min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.duration_min && (
          <p className="mt-1 text-xs text-danger">{errors.duration_min}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink">Price ({currency})</label>
        <input
          type="number"
          step="0.01"
          value={priceDollars}
          onChange={(e) => setPriceDollars(e.target.value)}
          className="w-24 min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.price_cents && (
          <p className="mt-1 text-xs text-danger">{errors.price_cents}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center rounded-pill bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
      >
        {loading ? "Adding…" : "Add service"}
      </button>
      {errors.general && <p className="w-full text-xs text-danger">{errors.general}</p>}
    </form>
  );
}
