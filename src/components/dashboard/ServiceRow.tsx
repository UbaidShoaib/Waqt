"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { centsToDollars, dollarsToCents } from "@/lib/money";

interface Service {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  is_active: boolean;
}

const neutralBtn =
  "rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";
const solidBtn =
  "rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60";

export default function ServiceRow({
  service,
  currency,
}: {
  service: Service;
  currency: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [durationMin, setDurationMin] = useState(String(service.duration_min));
  const [priceDollars, setPriceDollars] = useState(
    String(centsToDollars(service.price_cents))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setName(service.name);
    setDurationMin(String(service.duration_min));
    setPriceDollars(String(centsToDollars(service.price_cents)));
    setError(null);
    setEditing(true);
  }

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError("Couldn't save — try again.");
        setLoading(false);
        return;
      }
      setEditing(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Couldn't save — try again.");
      setLoading(false);
    }
  }

  function handleSave() {
    const duration = Number(durationMin);
    const price = Number(priceDollars);
    if (!name.trim() || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(price) || price < 0) {
      setError("Please check the values and try again.");
      return;
    }
    patch({
      name: name.trim(),
      duration_min: duration,
      price_cents: dollarsToCents(price),
    });
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-end gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-slate-400"
        />
        <input
          type="number"
          value={durationMin}
          onChange={(e) => setDurationMin(e.target.value)}
          className="w-24 rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-slate-400"
        />
        <input
          type="number"
          step="0.01"
          value={priceDollars}
          onChange={(e) => setPriceDollars(e.target.value)}
          className="w-24 rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-slate-400"
        />
        <button type="button" disabled={loading} onClick={handleSave} className={solidBtn}>
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="font-medium">{service.name}</span>
        <span className="ml-2 text-slate-500">
          {service.duration_min} min ·{" "}
          {centsToDollars(service.price_cents).toLocaleString(undefined, {
            style: "currency",
            currency,
          })}
          {!service.is_active && " · inactive"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={startEdit} className={neutralBtn}>
          Edit
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => patch({ is_active: !service.is_active })}
          className={neutralBtn}
        >
          {service.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
