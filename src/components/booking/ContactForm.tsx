import type { ContactInput } from "@/lib/validation/booking";

const CHANNELS: { value: ContactInput["preferredChannel"]; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
];

export default function ContactForm({
  customer,
  errors,
  submitting,
  onChange,
  onSubmit,
}: {
  customer: ContactInput;
  errors: Record<string, string>;
  submitting: boolean;
  onChange: (field: keyof ContactInput, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-sm font-medium text-slate-500">Your details</h2>

      <div>
        <input
          type="text"
          placeholder="Full name"
          value={customer.name}
          onChange={(e) => onChange("name", e.target.value)}
          className={`w-full rounded-lg border p-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
            errors.name ? "border-red-400" : "border-slate-200"
          }`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <input
          type="tel"
          placeholder="Phone number"
          value={customer.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className={`w-full rounded-lg border p-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
            errors.phone ? "border-red-400" : "border-slate-200"
          }`}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <input
          type="email"
          placeholder="Email address"
          value={customer.email}
          onChange={(e) => onChange("email", e.target.value)}
          className={`w-full rounded-lg border p-2 outline-none focus:border-brand focus:ring-1 focus:ring-brand ${
            errors.email ? "border-red-400" : "border-slate-200"
          }`}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {errors.contact && <p className="text-xs text-red-600">{errors.contact}</p>}

      <div className="flex gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.value}
            type="button"
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
