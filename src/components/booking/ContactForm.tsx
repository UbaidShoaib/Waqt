import { consentText, type ContactInput } from "@/lib/validation/booking";
import Field from "@/components/ui/Field";
import SectionTitle from "@/components/ui/SectionTitle";

const CHANNELS: { value: ContactInput["preferredChannel"]; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

export const CONTACT_FORM_ID = "waqt-contact";

export default function ContactForm({
  businessName,
  customer,
  errors,
  onChange,
  onSubmit,
}: {
  businessName: string;
  customer: ContactInput;
  errors: Record<string, string>;
  onChange: <K extends keyof ContactInput>(field: K, value: ContactInput[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form id={CONTACT_FORM_ID} onSubmit={onSubmit} noValidate className="animate-rise space-y-4">
      <SectionTitle step={4}>Your details</SectionTitle>

      <Field
        label="Full name"
        autoComplete="name"
        value={customer.name}
        error={errors.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <Field
        label="Phone"
        type="tel"
        autoComplete="tel"
        placeholder="+92 300 1234567"
        hint="Include your country code."
        value={customer.phone}
        error={errors.phone}
        onChange={(e) => onChange("phone", e.target.value)}
      />
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={customer.email}
        error={errors.email}
        onChange={(e) => onChange("email", e.target.value)}
      />
      {errors.contact && (
        <p role="alert" className="text-xs font-medium text-danger">
          {errors.contact}
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-semibold">Remind me by</legend>
        <div className="grid grid-cols-3 gap-2">
          {CHANNELS.map((c) => {
            const selected = customer.preferredChannel === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange("preferredChannel", c.value)}
                className={`min-h-11 rounded-pill text-sm transition ${
                  selected
                    ? "bg-ink font-semibold text-paper"
                    : "border border-line bg-paper-raised hover:border-ink-muted"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="flex items-start gap-3 rounded-card border border-line-soft bg-paper-raised p-3 text-xs leading-relaxed text-ink-muted">
          <input
            type="checkbox"
            checked={customer.messagingConsent}
            onChange={(e) => onChange("messagingConsent", e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]"
          />
          <span>{consentText(businessName)}</span>
        </label>
        {errors.consent && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
            {errors.consent}
          </p>
        )}
      </div>
    </form>
  );
}
