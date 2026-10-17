"use client";

import { useState } from "react";

export default function BrandingForm({
  businessId,
  initialLogoUrl,
  initialBrandColor,
  initialWelcomeMessage,
}: {
  businessId: string;
  initialLogoUrl: string | null;
  initialBrandColor: string | null;
  initialWelcomeMessage: string | null;
}) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage ?? "");
  const [useDefaultColor, setUseDefaultColor] = useState(initialBrandColor === null);
  const [brandColor, setBrandColor] = useState(initialBrandColor ?? "#0f172a");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSaved(false);

    try {
      const res = await fetch(`/api/businesses/${businessId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: logoUrl.trim() === "" ? null : logoUrl.trim(),
          welcome_message: welcomeMessage.trim() === "" ? null : welcomeMessage,
          brand_color: useDefaultColor ? null : brandColor,
        }),
      });

      if (res.status === 200) {
        setSaved(true);
        setLoading(false);
        return;
      }

      if (res.status === 400) {
        const body = await res.json();
        const fieldErrors = body.error?.fieldErrors ?? {};
        const mapped: Record<string, string> = {};
        for (const field of ["logo_url", "brand_color", "welcome_message"]) {
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
    <form onSubmit={handleSubmit} className="max-w-sm space-y-3">
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Logo URL</label>
        <input
          type="url"
          placeholder="https://example.com/logo.png"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {errors.logo_url && <p className="mt-1 text-xs text-danger">{errors.logo_url}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Brand color</label>
        {useDefaultColor ? (
          <button
            type="button"
            onClick={() => setUseDefaultColor(false)}
            className="min-h-9 rounded-pill border border-line bg-paper-raised px-3.5 text-xs font-semibold text-ink transition hover:border-ink"
          >
            Set custom color
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-11 w-14 rounded-card border border-line"
            />
            <button
              type="button"
              onClick={() => setUseDefaultColor(true)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Use default
            </button>
          </div>
        )}
        {errors.brand_color && (
          <p className="mt-1 text-xs text-danger">{errors.brand_color}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-ink">Welcome message</label>
        <textarea
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          maxLength={280}
          rows={3}
          className="w-full min-h-11 rounded-card border border-line bg-paper-raised px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <p className="mt-1 text-xs text-ink-muted">{welcomeMessage.length}/280</p>
        {errors.welcome_message && (
          <p className="mt-1 text-xs text-danger">{errors.welcome_message}</p>
        )}
      </div>

      {errors.general && <p className="text-sm text-danger">{errors.general}</p>}
      {saved && <p className="text-sm text-success">Saved.</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex min-h-12 items-center justify-center rounded-pill bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
