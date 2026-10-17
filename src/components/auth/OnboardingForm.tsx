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
          className="w-full min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="URL slug (e.g. your-salon)"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          required
          className="w-full min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.slug && <p className="mt-1 text-xs text-danger">{errors.slug}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          required
          className="w-full min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.timezone && <p className="mt-1 text-xs text-danger">{errors.timezone}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="Currency (e.g. USD)"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          required
          className="w-full min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.currency && <p className="mt-1 text-xs text-danger">{errors.currency}</p>}
      </div>

      {errors.general && <p className="text-sm text-danger">{errors.general}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex min-h-12 items-center justify-center rounded-pill bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create business"}
      </button>
    </form>
  );
}
