"use client";

// Shared booking flow — used by both the direct-link page (/b/[slug]) and
// the iframe embed (/embed/[slug]) so the two paths can't drift (TRD Flows B/C).
// Steps: pick service → pick slot → contact details → confirm.

import { useState } from "react";

export interface PublicService {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
}

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  logo_url: string | null;
  brand_color: string | null;
  welcome_message: string | null;
}

export default function BookingFlow({
  business,
  services,
  source,
}: {
  business: PublicBusiness;
  services: PublicService[];
  source: "direct_link" | "widget";
}) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  // TODO Week 2: date picker + slot grid backed by
  // GET /api/public/:slug/slots, then POST /api/public/:slug/bookings.
  // On success in the embed, notify the host page:
  //   window.parent.postMessage({ type: "waqt:booking-complete" }, "*")

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <header className="flex items-center gap-3">
        {business.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-xl font-semibold">{business.name}</h1>
          {business.welcome_message && (
            <p className="text-sm text-slate-600">{business.welcome_message}</p>
          )}
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-slate-500">Choose a service</h2>
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => setServiceId(s.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              serviceId === s.id ? "border-brand ring-1 ring-brand" : "border-slate-200"
            }`}
          >
            <span className="font-medium">{s.name}</span>
            <span className="ml-2 text-sm text-slate-500">
              {s.duration_min} min ·{" "}
              {(s.price_cents / 100).toLocaleString(undefined, {
                style: "currency",
                currency: business.currency,
              })}
            </span>
          </button>
        ))}
      </section>

      {status === "done" && (
        <p className="rounded-lg bg-green-50 p-3 text-green-800">
          Booking confirmed — you’ll receive a confirmation shortly.
        </p>
      )}

      <footer className="pt-4 text-center text-xs text-slate-400">
        Powered by Waqt
      </footer>
    </div>
  );
}
