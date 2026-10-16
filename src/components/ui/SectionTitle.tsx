/** Numbered serif step heading used across the booking flow. */
export default function SectionTitle({ step, children }: { step?: number; children: React.ReactNode }) {
  return (
    <h2 className="font-display text-lg font-semibold text-ink">
      {step !== undefined && <span className="text-ink-muted">{step}. </span>}
      {children}
    </h2>
  );
}
