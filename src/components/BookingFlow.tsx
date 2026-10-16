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
import { buildIcs } from "@/lib/ics";
import Button from "@/components/ui/Button";
import Notice from "@/components/ui/Notice";
import { validateContact, type ContactInput } from "@/lib/validation/booking";
import ServiceList from "@/components/booking/ServiceList";
import DateStrip from "@/components/booking/DateStrip";
import SlotGrid from "@/components/booking/SlotGrid";
import ContactForm, { CONTACT_FORM_ID } from "@/components/booking/ContactForm";

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
  const done = status === "done" && bookingResult !== null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-paper">
      <BusinessHeader business={business} />

      {done ? (
        <Confirmation business={business} service={selectedService} booking={bookingResult} />
      ) : (
        <div className="flex flex-1 flex-col gap-7 px-6 pb-32 pt-6">
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

          {showTzNote && serviceId && (
            <p className="-mt-4 text-xs text-ink-muted">
              Times shown in {business.timezone.replaceAll("_", " ")} time.
            </p>
          )}

          {submitError && !selectedSlot && <Notice>{submitError.message}</Notice>}

          {selectedSlot && (
            <>
              <ContactForm
                businessName={business.name}
                customer={customer}
                errors={formErrors}
                onChange={handleContactChange}
                onSubmit={handleSubmit}
              />
              {submitError && <Notice>{submitError.message}</Notice>}
            </>
          )}

          <p className="mt-auto pt-4 text-center text-xs text-ink-muted">
            Booking by <span className="font-display font-semibold text-ink">Waqt</span>
          </p>
        </div>
      )}

      {!done && selectedService && selectedSlot && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-line-soft bg-paper/95 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-[13px] text-ink-muted">
              {formatDateLabel(selectedDate!, business.timezone)} · {formatSlotLabel(selectedSlot.starts_at, business.timezone)}
            </p>
            <p className="truncate font-bold">{selectedService.name}</p>
          </div>
          <Button type="submit" form={CONTACT_FORM_ID} size="lg" disabled={status === "submitting"}>
            {status === "submitting" ? "Booking…" : "Confirm"}
          </Button>
        </div>
      )}
    </div>
  );
}

function BusinessHeader({ business }: { business: PublicBusiness }) {
  return (
    <header className="relative overflow-hidden bg-ink px-6 pb-6 pt-7 text-paper">
      <ClockMark />
      <div className="relative flex items-center gap-3">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logo_url} alt="" className="h-12 w-12 rounded-full bg-paper object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand font-display text-[22px] font-semibold text-brand-fg"
          >
            {business.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <h1 className="font-display text-[26px] font-semibold leading-tight">{business.name}</h1>
      </div>
      {business.welcome_message && (
        <p className="relative mt-3.5 text-sm leading-relaxed text-ink-soft">{business.welcome_message}</p>
      )}
    </header>
  );
}

/** Waqt's signature mark — a clock face, tinted with the tenant's brand. */
function ClockMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 150 150"
      className="pointer-events-none absolute -right-9 -top-8 h-[150px] w-[150px] text-brand opacity-20"
    >
      <circle cx="75" cy="75" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="75" cy="75" r="42" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="75" y1="75" x2="75" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="75" x2="106" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Confirmation({
  business,
  service,
  booking,
}: {
  business: PublicBusiness;
  service: PublicService | null;
  booking: BookingResult;
}) {
  const date = formatDateLabel(formatDateInTimezone(new Date(booking.starts_at), business.timezone), business.timezone);
  const time = formatSlotLabel(booking.starts_at, business.timezone);
  const title = `${service?.name ?? "Appointment"} at ${business.name}`;

  function addToCalendar() {
    const ics = buildIcs({ uid: booking.id, startsAt: booking.starts_at, endsAt: booking.ends_at, title });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "booking.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div role="status" className="flex flex-1 animate-rise flex-col items-center gap-5 px-6 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-brand-fg">
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <div className="space-y-1">
        <h2 className="font-display text-[28px] font-semibold">You&apos;re booked</h2>
        <p className="text-ink-muted">See you soon at {business.name}.</p>
      </div>
      <dl className="w-full divide-y divide-line-soft rounded-card border border-line bg-paper-raised text-left text-sm">
        <div className="flex justify-between gap-4 p-4">
          <dt className="text-ink-muted">Service</dt>
          <dd className="font-semibold">{service?.name}</dd>
        </div>
        <div className="flex justify-between gap-4 p-4">
          <dt className="text-ink-muted">When</dt>
          <dd className="font-semibold">
            {date} · {time}
          </dd>
        </div>
      </dl>
      <Button variant="primary" size="lg" className="w-full" onClick={addToCalendar}>
        Add to my calendar
      </Button>
      <p className="text-xs text-ink-muted">
        Need to change or cancel? Contact {business.name} directly.
      </p>
    </div>
  );
}
