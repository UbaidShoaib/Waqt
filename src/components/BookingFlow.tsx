"use client";

// Shared booking flow — used by both the direct-link page (/b/[slug]) and
// the iframe embed (/embed/[slug]) so the two paths can't drift (TRD Flows B/C).
// Steps: pick service → pick date → pick slot → contact details → confirm.
// The visible step is derived from state rather than tracked separately, so
// clearing one field (e.g. selectedSlot after a 409) automatically snaps the
// UI back to the right place.

import { useCallback, useEffect, useState } from "react";
import type { Slot } from "@/lib/slots";
import { formatDateInTimezone, formatDateLabel, formatSlotLabel, upcomingDates } from "@/lib/dates";
import { validateContact, type ContactInput } from "@/lib/validation/booking";
import ServiceList from "@/components/booking/ServiceList";
import DateStrip from "@/components/booking/DateStrip";
import SlotGrid from "@/components/booking/SlotGrid";
import ContactForm from "@/components/booking/ContactForm";

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

type SubmitErrorKind = "validation" | "conflict" | "rate_limited" | "generic";

interface BookingResult {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
}

const DATE_WINDOW_DAYS = 28;

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
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle"
  );
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [customer, setCustomer] = useState<ContactInput>({
    name: "",
    phone: "",
    email: "",
    preferredChannel: "whatsapp",
    messagingConsent: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState<{ kind: SubmitErrorKind; message: string } | null>(
    null
  );
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [browserTz, setBrowserTz] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === serviceId) ?? null;

  // Populate client-only values (Date/Intl) in an effect, not during render,
  // to avoid a server/client hydration mismatch — see plan notes.
  useEffect(() => {
    setDateOptions(upcomingDates(business.timezone, DATE_WINDOW_DAYS));
    try {
      setBrowserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setBrowserTz(business.timezone);
    }
  }, [business.timezone]);

  const refetchSlots = useCallback(
    async (signal?: AbortSignal) => {
      if (!serviceId || !selectedDate) return;
      setSlotsStatus("loading");
      try {
        const res = await fetch(
          `/api/public/${business.slug}/slots?service_id=${serviceId}&date=${selectedDate}`,
          { signal }
        );
        const data = await res.json();
        if (signal?.aborted) return;
        setSlots(res.ok ? data.slots ?? [] : []);
        setSlotsStatus(res.ok ? "loaded" : "error");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSlotsStatus("error");
      }
    },
    [serviceId, selectedDate, business.slug]
  );

  useEffect(() => {
    if (!serviceId || !selectedDate) return;
    const controller = new AbortController();
    refetchSlots(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, selectedDate]);

  function handleSelectService(id: string) {
    setServiceId(id);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setSubmitError(null);
    setStatus("idle");
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlots([]);
  }

  function handleContactChange<K extends keyof ContactInput>(field: K, value: ContactInput[K]) {
    setCustomer((c) => ({ ...c, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !selectedSlot) return;

    const errors = validateContact(customer);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setStatus("submitting");
    setSubmitError(null);

    try {
      const res = await fetch(`/api/public/${business.slug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          starts_at: selectedSlot.starts_at,
          customer: {
            name: customer.name,
            phone: customer.phone || undefined,
            email: customer.email || undefined,
            preferred_channel: customer.preferredChannel,
            messaging_consent: customer.messagingConsent,
          },
          source,
        }),
      });

      if (res.status === 201) {
        const body = (await res.json()) as BookingResult;
        setBookingResult(body);
        setStatus("done");
        if (source === "widget") {
          window.parent.postMessage({ type: "waqt:booking-complete", booking: body }, "*");
        }
        return;
      }

      if (res.status === 409) {
        setSelectedSlot(null);
        refetchSlots();
        setSubmitError({
          kind: "conflict",
          message: "That time was just booked by someone else — pick another time below.",
        });
        setStatus("idle");
        return;
      }

      if (res.status === 429) {
        setSubmitError({
          kind: "rate_limited",
          message: "Too many attempts. Please wait a minute and try again.",
        });
        setStatus("idle");
        return;
      }

      if (res.status === 400) {
        const body = await res.json();
        const message =
          typeof body.error === "string"
            ? body.error === "slot is in the past"
              ? "That time has already passed — please pick another."
              : body.error
            : "Please check your details and try again.";
        setSubmitError({ kind: "validation", message });
        setStatus("idle");
        return;
      }

      setSubmitError({ kind: "generic", message: "Something went wrong. Please try again." });
      setStatus("idle");
    } catch {
      setSubmitError({ kind: "generic", message: "Something went wrong. Please try again." });
      setStatus("idle");
    }
  }

  const showTzNote = browserTz !== null && browserTz !== business.timezone;

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

      {status === "done" && bookingResult ? (
        <div role="status" className="space-y-1 rounded-lg bg-green-50 p-3 text-green-800">
          <p className="font-medium">Booking confirmed</p>
          <p className="text-sm">
            {selectedService?.name} ·{" "}
            {formatDateLabel(formatDateInTimezone(new Date(bookingResult.starts_at), business.timezone), business.timezone)}{" "}
            at {formatSlotLabel(bookingResult.starts_at, business.timezone)}
          </p>
          <p className="text-xs">Please save this time — contact {business.name} directly to change or cancel.</p>
        </div>
      ) : (
        <>
          <ServiceList
            services={services}
            business={business}
            selectedId={serviceId}
            onSelect={handleSelectService}
          />

          {serviceId && (
            <DateStrip
              timezone={business.timezone}
              dateOptions={dateOptions}
              selectedDate={selectedDate}
              onSelect={handleSelectDate}
            />
          )}

          {showTzNote && (
            <p className="text-xs text-slate-400">
              Times shown in {business.timezone.replaceAll("_", " ")} time.
            </p>
          )}

          {serviceId && selectedDate && (
            <SlotGrid
              slots={slots}
              status={slotsStatus}
              timezone={business.timezone}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
              onRetry={() => refetchSlots()}
            />
          )}

          {submitError && !selectedSlot && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {submitError.message}
            </p>
          )}

          {selectedSlot && (
            <>
              <ContactForm
                businessName={business.name}
                customer={customer}
                errors={formErrors}
                submitting={status === "submitting"}
                onChange={handleContactChange}
                onSubmit={handleSubmit}
              />
              {submitError && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  {submitError.message}
                </p>
              )}
            </>
          )}
        </>
      )}

      <footer className="pt-4 text-center text-xs text-slate-400">
        Powered by Waqt
      </footer>
    </div>
  );
}
