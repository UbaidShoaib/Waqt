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
        className="min-h-9 rounded-pill border border-danger/40 bg-paper-raised px-3.5 text-xs font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-60"
      >
        Remove
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
