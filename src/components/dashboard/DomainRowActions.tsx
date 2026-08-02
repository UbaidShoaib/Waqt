"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DomainRowActions({
  businessId,
  domainId,
}: {
  businessId: string;
  domainId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/allowed-domains/${domainId}`,
        { method: "DELETE" }
      );
      if (res.status === 204) {
        router.refresh();
        return;
      }
      setError("Couldn't remove — try again.");
      setLoading(false);
    } catch {
      setError("Couldn't remove — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleRemove}
        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        Remove
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
