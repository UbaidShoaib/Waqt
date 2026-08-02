"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone("UTC");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, timezone, currency }),
      });

      if (res.status === 201) {
        router.push("/dashboard");
        return;
      }

      if (res.status === 409) {
        setErrors({ slug: "That name is taken — try a different one." });
        setLoading(false);
        return;
      }

      if (res.status === 400) {
        const body = await res.json();
        const fieldErrors = body.error?.fieldErrors ?? {};
        const mapped: Record<string, string> = {};
        for (const field of ["name", "slug", "timezone", "currency"]) {
          if (fieldErrors[field]?.[0]) mapped[field] = fieldErrors[field][0];
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 p-2 outline-none focus:border-slate-400"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="URL slug (e.g. your-salon)"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          required
          className="w-full rounded-lg border border-slate-200 p-2 outline-none focus:border-slate-400"
        />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-200 p-2 outline-none focus:border-slate-400"
        />
        {errors.timezone && <p className="mt-1 text-xs text-red-600">{errors.timezone}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="Currency (e.g. USD)"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          required
          className="w-full rounded-lg border border-slate-200 p-2 outline-none focus:border-slate-400"
        />
        {errors.currency && <p className="mt-1 text-xs text-red-600">{errors.currency}</p>}
      </div>

      {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 p-3 font-medium text-white transition disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create business"}
      </button>
    </form>
  );
}
