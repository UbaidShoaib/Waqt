"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddDomainForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/businesses/${businessId}/allowed-domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (res.status === 201) {
        setDomain("");
        router.refresh();
        setLoading(false);
        return;
      }

      if (res.status === 400) {
        setError("Enter a valid domain (e.g. example.com).");
        setLoading(false);
        return;
      }

      if (res.status === 409) {
        setError("That domain is already added.");
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
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-slate-600">Domain</label>
        <input
          type="text"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-slate-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Adding…" : "Add domain"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
