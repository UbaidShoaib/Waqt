import { consentText, type ContactInput } from "@/lib/validation/booking";

const CHANNELS: { value: ContactInput["preferredChannel"]; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

export default function ContactForm({
  businessName,
  customer,
  errors,
  submitting,
  onChange,
  onSubmit,
}: {
  businessName: string;
  customer: ContactInput;
  errors: Record<string, string>;
  submitting: boolean;
  onChange: <K extends keyof ContactInput>(field: K, value: ContactInput[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-sm font-medium text-slate-500">Your details</h2>

      <div>
        <label htmlFor="waqt-name" className="mb-1 block text-sm text-slate-700">
          Full name
        </label>
        <input
          id="waqt-name"
          type="text" autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "waqt-name-error" : undefined}
          value={customer.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={`w-full rounded-lg border p-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
            errors.name ? "border-red-400" : "border-slate-200"
          }`}
        />
        {errors.name && <p id="waqt-name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="waqt-phone" className="mb-1 block text-sm text-slate-700">
          Phone (with country code)
        </label>
        <input
          id="waqt-phone"
          type="tel" autoComplete="tel"
          placeholder="+92 300 1234567"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "waqt-phone-error" : undefined}
          value={customer.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className={`w-full rounded-lg border p-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
            errors.phone ? "border-red-400" : "border-slate-200"
          }`}
        />
        {errors.phone && <p id="waqt-phone-error" className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="waqt-email" className="mb-1 block text-sm text-slate-700">
          Email
        </label>
        <input
          id="waqt-email"
          type="email" autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "waqt-email-error" : undefined}
          value={customer.email}
          onChange={(e) => onChange("email", e.target.value)}
          className={`w-full rounded-lg border p-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
            errors.email ? "border-red-400" : "border-slate-200"
          }`}
        />
        {errors.email && <p id="waqt-email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {errors.contact && (
        <p role="alert" className="text-xs text-red-600">
          {errors.contact}
        </p>
      )}

      <p id="waqt-channel-label" className="text-sm text-slate-700">
        Send reminders by
      </p>
      <div role="group" aria-labelledby="waqt-channel-label" className="flex gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={customer.preferredChannel === c.value}
            onClick={() => onChange("preferredChannel", c.value)}
            className={`flex-1 rounded-lg border p-2 text-sm transition ${
              customer.preferredChannel === c.value
                ? "border-brand ring-1 ring-brand"
                : "border-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={customer.messagingConsent}
            onChange={(e) => onChange("messagingConsent", e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            className="mt-0.5"
          />
          <span>{consentText(businessName)}</span>
        </label>
        {errors.consent && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {errors.consent}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand p-3 font-medium text-white transition disabled:opacity-60"
      >
        {submitting ? "Booking…" : "Confirm booking"}
      </button>
    </form>
  );
}
